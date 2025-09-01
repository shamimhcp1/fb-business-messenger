import { NextResponse } from 'next/server'
import { db } from '@/db'
import { conversations as convs, messages as msgs, facebookConnections } from '@/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { decrypt, unpack } from '@/lib/crypto'
import { sendMessage } from '@/lib/meta'
import crypto from 'crypto'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const rows = await db
    .select()
    .from(msgs)
    .where(eq(msgs.conversationId, id))
    .orderBy(asc(msgs.timestamp))
    .limit(100)
  return NextResponse.json({ data: rows })
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = await req.json()
  const { text, tag } = body
  const conv = (await db.select().from(convs).where(eq(convs.id, id)).limit(1))[0]
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // 24-hour window: if last inbound older than 24h, require valid tag
  const within24h = Date.now() - conv.lastMessageAt.getTime() < 24 * 3600 * 1000
  const allowedTags = ['ACCOUNT_UPDATE', 'POST_PURCHASE_UPDATE', 'CONFIRMED_EVENT_UPDATE']
  if (!within24h && !allowedTags.includes(tag)) {
    return NextResponse.json({ error: 'outside_24h_requires_tag' }, { status: 400 })
  }

  const conn = (
    await db
      .select()
      .from(facebookConnections)
      .where(and(eq(facebookConnections.tenantId, conv.tenantId), eq(facebookConnections.pageId, conv.pageId)))
      .limit(1)
  )[0]
  if (!conn) return NextResponse.json({ error: 'no_connection' }, { status: 400 })

  const token = decrypt(unpack(conn.pageTokenEnc))
  const payload: { recipient: { id: string }; message: { text: string }; tag?: string } = {
    recipient: { id: conv.psid },
    message: { text },
  }
  if (!within24h && tag) payload.tag = tag

  await sendMessage(conv.pageId, token, payload)

  const newId = crypto.randomUUID()
  const mid = 'local-' + crypto.randomUUID()
  const timestamp = new Date()
  await db.insert(msgs).values({
    id: newId,
    conversationId: conv.id,
    direction: 'outbound',
    mid,
    text,
    timestamp,
    deliveryState: 'sent',
  })

  return NextResponse.json({
    ok: true,
    message: {
      id: newId,
      conversationId: conv.id,
      direction: 'outbound',
      mid,
      text,
      attachmentsJson: null,
      timestamp: timestamp.toISOString(),
      deliveryState: 'sent',
      readAt: null,
    },
  })
}

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { conversations as convs, facebookConnections } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const conv = (
    await db.select().from(convs).where(eq(convs.id, id)).limit(1)
  )[0]
  if (!conv) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const conn = (
    await db
      .select()
      .from(facebookConnections)
      .where(
        and(
          eq(facebookConnections.tenantId, conv.tenantId),
          eq(facebookConnections.pageId, conv.pageId),
        ),
      )
      .limit(1)
  )[0]
  if (!conn) {
    return NextResponse.json({ error: 'no_connection' }, { status: 400 })
  }
  return NextResponse.json({ data: { pageTokenEnc: conn.pageTokenEnc } })
}

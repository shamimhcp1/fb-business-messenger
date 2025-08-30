import { NextResponse } from 'next/server'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { and, eq, like, desc } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId') || undefined
  const pageId = searchParams.get('pageId') || undefined
  const q = searchParams.get('q') || undefined

  const conds = [] as any[]
  if (tenantId) conds.push(eq(conversations.tenantId, tenantId))
  if (pageId) conds.push(eq(conversations.pageId, pageId))
  if (q) conds.push(like(conversations.psid, `%${q}%`))

  const rows = await db
    .select()
    .from(conversations)
    .where(conds.length ? and(...conds) : undefined as any)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50)

  return NextResponse.json({ data: rows })
}

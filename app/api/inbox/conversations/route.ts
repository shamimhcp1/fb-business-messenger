import { NextResponse } from 'next/server'
import { db } from '@/db'
import { conversations, facebookConnections } from '@/db/schema'
import { and, eq, like, desc, SQL } from 'drizzle-orm'
import { decrypt, unpack } from '@/lib/crypto'
import { getUserProfile } from '@/lib/meta'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId') || undefined
  const pageId = searchParams.get('pageId') || undefined
  const q = searchParams.get('q') || undefined

  const conds: SQL[] = []
  if (tenantId) conds.push(eq(conversations.tenantId, tenantId))
  if (pageId) conds.push(eq(conversations.pageId, pageId))
  if (q) conds.push(like(conversations.psid, `%${q}%`))

  const rows = await db
    .select()
    .from(conversations)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50)

  const data = await Promise.all(
    rows.map(async (row) => {
      try {
        const conn = (
          await db
            .select()
            .from(facebookConnections)
            .where(
              and(
                eq(facebookConnections.tenantId, row.tenantId),
                eq(facebookConnections.pageId, row.pageId),
              ),
            )
            .limit(1)
        )[0]
        if (conn) {
          const token = decrypt(unpack(conn.pageTokenEnc))
          const profile = await getUserProfile(row.psid, token)
          return {
            ...row,
            name: profile.name,
            profilePic: profile.picture?.data?.url,
          }
        }
      } catch (err) {
        console.error('conversation_profile_fetch_error', err)
      }
      return row
    }),
  )

  return NextResponse.json({ data })
}

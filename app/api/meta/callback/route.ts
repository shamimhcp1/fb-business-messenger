import { NextResponse } from 'next/server'
import { exchangeCodeForToken, exchangeLongLivedUserToken, getPages, subscribePage } from '@/lib/meta'
import { db } from '@/db'
import { users, facebookConnections } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { encrypt, pack } from '@/lib/crypto'
import crypto from 'crypto'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  if (error) return NextResponse.redirect(`/connections?error=${encodeURIComponent(error)}`)
  if (!code) return NextResponse.redirect('/connections?error=missing_code')

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const redirectUri = `${base}/api/meta/callback`

  try {
    const short = await exchangeCodeForToken({ code, redirectUri })
    const long = await exchangeLongLivedUserToken(short.access_token)
    const pages = await getPages(long.access_token)

    // MVP: associate pages with the first tenant found for the first user (placeholder).
    // In real flow, use session to get authenticated user and tenant.
    const anyUser = (await db.select().from(users).limit(1))[0]
    if (!anyUser) return NextResponse.redirect('/connections?error=no_user')

    for (const p of pages.data) {
      const enc = pack(encrypt(p.access_token))
      await db
        .insert(facebookConnections)
        .values({
          id: crypto.randomUUID(),
          tenantId: anyUser.tenantId,
          pageId: p.id,
          pageName: p.name,
          pageTokenEnc: enc,
          connectedByUserId: anyUser.id,
          status: 'active',
        })
        .onConflictDoUpdate({
          target: [facebookConnections.tenantId, facebookConnections.pageId],
          set: {
            pageName: p.name,
            pageTokenEnc: enc,
            status: 'active',
          },
        })
      await subscribePage(p.id, p.access_token)
    }

    return NextResponse.redirect('/connections?ok=1')
  } catch (e: any) {
    return NextResponse.redirect(`/connections?error=${encodeURIComponent(e?.message || 'oauth_failed')}`)
  }
}


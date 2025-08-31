import { NextResponse } from 'next/server'
import { exchangeCodeForToken, exchangeLongLivedUserToken, getPages, subscribePage } from '@/lib/meta'
import { db } from '@/db'
import { users, facebookConnections } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { encrypt, pack } from '@/lib/crypto'
import crypto from 'crypto'

function getBaseUrl(req: Request) {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (envBase) return envBase.replace(/\/$/, '')
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (host) return `${proto}://${host}`
  return new URL(req.url).origin
}

export async function GET(req: Request) {
  const currentUrl = new URL(req.url)
  const { searchParams } = currentUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  // Build absolute redirect URLs using public base URL or forwarded headers
  const baseUrl = getBaseUrl(req)
  const connectionsUrl = new URL('/connections', baseUrl)
  if (error) {
    connectionsUrl.search = ''
    connectionsUrl.searchParams.set('error', error)
    return NextResponse.redirect(connectionsUrl)
  }
  if (!code) {
    connectionsUrl.search = ''
    connectionsUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(connectionsUrl)
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const redirectUri = `${base}/api/meta/callback`

  try {
    const short = await exchangeCodeForToken({ code, redirectUri })
    const long = await exchangeLongLivedUserToken(short.access_token)
    const pages = await getPages(long.access_token)

    // MVP: associate pages with the first tenant found for the first user (placeholder).
    // In real flow, use session to get authenticated user and tenant.
    const anyUser = (await db.select().from(users).limit(1))[0]
    if (!anyUser) {
      const noUserUrl = new URL(connectionsUrl)
      noUserUrl.search = ''
      noUserUrl.searchParams.set('error', 'no_user')
      return NextResponse.redirect(noUserUrl)
    }

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

    const okUrl = new URL(connectionsUrl)
    okUrl.search = ''
    okUrl.searchParams.set('ok', '1')
    return NextResponse.redirect(okUrl)
  } catch (e: any) {
    const errUrl = new URL(connectionsUrl)
    errUrl.search = ''
    errUrl.searchParams.set('error', e?.message || 'oauth_failed')
    return NextResponse.redirect(errUrl)
  }
}


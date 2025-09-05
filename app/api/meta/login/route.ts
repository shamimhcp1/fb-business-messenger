import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId') || undefined

  const appId = process.env.META_APP_ID!
  const v = process.env.META_API_VERSION || 'v23.0'
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const redirectUri = `${base}/api/meta/callback`
  const scope = [
    'pages_manage_metadata',
    'pages_messaging',
    'pages_read_engagement',
    'pages_show_list',
  ].join(',')
  const url = new URL(`https://www.facebook.com/${v}/dialog/oauth`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')
  if (tenantId) url.searchParams.set('state', tenantId)
  return NextResponse.redirect(url.toString())
}


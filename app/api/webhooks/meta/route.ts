import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { webhookQueue } from '@/lib/queue'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function POST(req: Request) {
  const appSecret = process.env.META_APP_SECRET || ''
  const sig = (req.headers.get('x-hub-signature-256') || '').trim()
  const raw = await req.text()
  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(raw).digest('hex')
  if (!sig || !timingSafeEqual(sig, expected)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const entries = body.entry || []
  // Temporary debug log to verify delivery (remove in production)
  try {
    const first = entries[0]
    const pageId = first?.id
    const messaging = first?.messaging?.[0]
    const kind = messaging?.message ? 'message' : messaging?.delivery ? 'delivery' : messaging?.read ? 'read' : 'other'
    console.log('meta:webhook', {
      entries: entries.length,
      pageId,
      kind,
      timestamp: messaging?.timestamp,
    })
  } catch {}
  for (const entry of entries) {
    const job = await webhookQueue.add(
      'page-event',
      { entry },
      {
        removeOnComplete: 1000,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      }
    )
    // Temporary debug log (remove in production)
    console.log('meta:webhook:enqueued', { jobId: job.id })
  }

  return NextResponse.json({ ok: true })
}

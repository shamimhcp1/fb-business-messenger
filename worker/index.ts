import '@/lib/load-env'
import { Worker, QueueEvents } from 'bullmq'
import { redis } from '@/lib/redis'
import { db } from '@/db'
import { conversations, facebookConnections, messages } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { Emitter } from '@socket.io/redis-emitter'
import crypto from 'crypto'

const connection = redis.options as any

const queueName = 'webhooks'
const queueEvents = new QueueEvents(queueName, { connection })

function getEventId(entry: any) {
  try {
    const messaging = entry.messaging?.[0]
    return messaging?.message?.mid || messaging?.delivery?.watermark?.toString() || messaging?.timestamp?.toString()
  } catch {
    return undefined
  }
}

const emitter = new Emitter(redis as any)

async function upsertFromEntry(entry: any) {
  const pageId = String(entry.id).trim()
  const messaging = entry.messaging?.[0]
  if (!messaging) {
    console.log('worker:skip_no_messaging', { pageId })
    return
  }
  const kind = messaging?.message ? 'message' : messaging?.delivery ? 'delivery' : messaging?.read ? 'read' : 'other'
  const psid = String(messaging.sender?.id || messaging.recipient?.id || '').trim()
  const mid = messaging.message?.mid ? String(messaging.message.mid).trim() : undefined
  const text = messaging.message?.text || undefined

  // Resolve tenant via FacebookConnection
  const conn = (
    await db.select().from(facebookConnections).where(eq(facebookConnections.pageId, pageId)).limit(1)
  )[0]
  if (!conn) {
    console.warn('worker:no_connection_for_page', { pageId })
    return
  }

  // Only persist messages for actual 'message' events
  if (kind !== 'message' || !mid) {
    console.log('worker:skip_non_message', { kind, pageId })
    return
  }

  // Upsert conversation by (tenantId, pageId, psid)
  const convId = crypto.randomUUID()
  const now = new Date(messaging.timestamp || Date.now())
  // Insert if missing; otherwise do nothing
  await db
    .insert(conversations)
    .values({
      id: convId,
      tenantId: conn.tenantId,
      pageId,
      psid,
      lastMessageAt: now,
      unreadCount: 1,
      status: 'open',
    })
    .onConflictDoNothing({ target: [conversations.tenantId, conversations.pageId, conversations.psid] })

  // Always update lastMessageAt and increment unreadCount
  await db
    .update(conversations)
    .set({
      lastMessageAt: now,
      unreadCount: sql`"conversations"."unread_count" + 1`,
    })
    .where(
      and(
        eq(conversations.tenantId, conn.tenantId),
        eq(conversations.pageId, pageId),
        eq(conversations.psid, psid)
      )
    )

  const conversation = (
    await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.tenantId, conn.tenantId), eq(conversations.pageId, pageId), eq(conversations.psid, psid)))
      .limit(1)
  )[0]
  if (!conversation) {
    console.error('worker:conversation_upsert_missing', { tenantId: conn.tenantId, pageId, psid })
    return
  }

  // Upsert message by mid
  const messageId = crypto.randomUUID()
  await db
    .insert(messages)
    .values({
      id: messageId,
      conversationId: conversation.id,
      direction: 'inbound',
      mid,
      text,
      timestamp: now,
    })
    .onConflictDoNothing({ target: messages.mid })

  const message = (
    await db.select().from(messages).where(eq(messages.mid, mid)).limit(1)
  )[0]

  // Emit realtime event to tenant and page rooms
  emitter
    .to(`tenant:${conversation.tenantId}`)
    .to(`page:${pageId}`)
    .emit('message:new', { conversationId: conversation.id, message })
}

export const worker = new Worker(
  queueName,
  async job => {
    try {
      const { entry } = job.data
      console.log('worker:processing', { jobId: job.id, pageId: entry?.id })
      await upsertFromEntry(entry)
      console.log('worker:completed', { jobId: job.id })
    } catch (err: any) {
      console.error('worker:error', { jobId: job.id, err: err?.message })
      throw err
    }
  },
  { connection, concurrency: 5 }
)

queueEvents.on('completed', ({ jobId }) => {
  console.log('queue:completed', { jobId })
})

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error('queue:failed', { jobId, failedReason })
})

console.log('Webhook worker started')
;(async () => {
  try {
    const rows = await db.select({ pageId: facebookConnections.pageId }).from(facebookConnections)
    console.log('worker:connections_snapshot', { count: rows.length, pageIds: rows.map(r => r.pageId).slice(0, 5) })
  } catch (e: any) {
    console.warn('worker:connections_snapshot_error', e?.message)
  }
})()

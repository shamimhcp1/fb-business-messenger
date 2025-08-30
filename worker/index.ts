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
  const pageId = entry.id
  const messaging = entry.messaging?.[0]
  if (!messaging) return
  const psid = messaging.sender?.id || messaging.recipient?.id
  const mid = messaging.message?.mid || `evt-${messaging.timestamp}`
  const text = messaging.message?.text || undefined

  // Resolve tenant via FacebookConnection
  const conn = (
    await db.select().from(facebookConnections).where(eq(facebookConnections.pageId, pageId)).limit(1)
  )[0]
  if (!conn) return

  // Upsert conversation by (tenantId, pageId, psid)
  const convId = crypto.randomUUID()
  const now = new Date(messaging.timestamp || Date.now())
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
    .onConflictDoUpdate({
      target: [conversations.tenantId, conversations.pageId, conversations.psid],
      set: {
        lastMessageAt: now,
        unreadCount: sql`unread_count + 1`,
      },
    })

  const conversation = (
    await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.tenantId, conn.tenantId), eq(conversations.pageId, pageId), eq(conversations.psid, psid)))
      .limit(1)
  )[0]

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
    const { entry } = job.data
    await upsertFromEntry(entry)
  },
  { connection, concurrency: 5 }
)

queueEvents.on('completed', ({ jobId }) => {
  // hook for logging or metrics if needed
})

queueEvents.on('failed', ({ jobId, failedReason }) => {
  // hook for alerts if needed
})

console.log('Webhook worker started')

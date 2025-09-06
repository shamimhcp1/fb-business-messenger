import '@/lib/load-env'
import { Worker, QueueEvents } from 'bullmq'
import { redis } from '@/lib/redis'
import { db } from '@/db'
import { conversations, facebookConnections, messages } from '@/db/schema'
import { and, eq, sql, lte } from 'drizzle-orm'
import { Emitter } from '@socket.io/redis-emitter'
import crypto from 'crypto'
import type { RedisOptions } from 'ioredis'
import type { MessageAttachment } from '@/lib/types'
import { decrypt, unpack } from '@/lib/crypto'
import { getSticker } from '@/lib/meta'

const connection: RedisOptions = redis.options

const queueName = 'webhooks'
const queueEvents = new QueueEvents(queueName, { connection })

interface MessagingEntry {
  message?: { mid?: string; text?: string; attachments?: MessageAttachment[] }
  delivery?: { watermark?: number }
  read?: { watermark?: number }
  timestamp?: number
  sender?: { id?: string }
  recipient?: { id?: string }
}

interface WebhookEntry {
  id?: string
  messaging?: MessagingEntry[]
}

const emitter = new Emitter(redis)

async function upsertFromEntry(entry: WebhookEntry) {
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
  const attachments = messaging.message?.attachments

  // Resolve tenant via FacebookConnection
  const conn = (
    await db.select().from(facebookConnections).where(eq(facebookConnections.pageId, pageId)).limit(1)
  )[0]
  if (!conn) {
    console.warn('worker:no_connection_for_page', { pageId })
    return
  }

  if (kind === 'message' && mid) {
    if (attachments && attachments.length > 0) {
      const token = decrypt(unpack(conn.pageTokenEnc))
      for (const a of attachments) {
        const stickerId = Number(a.sticker_id ?? a.payload?.sticker_id)
        if (!Number.isNaN(stickerId) && stickerId > 0) {
          try {
            const info = await getSticker(stickerId, token)
            if (info.animated_gif_url) {
              a.payload = { ...a.payload, animated_url: info.animated_gif_url }
            }
          } catch (err) {
            console.warn('worker:sticker_fetch_error', { pageId, stickerId, err })
          }
        }
      }
    }
    const attachmentsJson =
      attachments && attachments.length > 0 ? JSON.stringify(attachments) : undefined

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
          eq(conversations.psid, psid),
        ),
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
        attachmentsJson,
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
      .emit('message:new', { conversationId: conversation.id, message, conversation })
    return
  }

  if (kind === 'read') {
    const watermark = messaging.read?.watermark
    if (!watermark) {
      console.log('worker:skip_read_no_watermark', { pageId })
      return
    }
    const readAt = new Date(watermark)
    const conversation = (
      await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.tenantId, conn.tenantId), eq(conversations.pageId, pageId), eq(conversations.psid, psid)))
        .limit(1)
    )[0]
    if (!conversation) {
      console.warn('worker:read_conversation_missing', { tenantId: conn.tenantId, pageId, psid })
      return
    }
    await db
      .update(messages)
      .set({ readAt, deliveryState: 'seen' })
      .where(
        and(
          eq(messages.conversationId, conversation.id),
          eq(messages.direction, 'outbound'),
          lte(messages.timestamp, readAt)
        )
      )
    return
  }

  console.log('worker:skip_unhandled', { kind, pageId })
}

interface WebhookJobData {
  entry: WebhookEntry
}

export const worker = new Worker<WebhookJobData>(
  queueName,
  async job => {
    try {
      const { entry } = job.data
      console.log('worker:processing', { jobId: job.id, pageId: entry?.id })
      await upsertFromEntry(entry)
      console.log('worker:completed', { jobId: job.id })
    } catch (err: unknown) {
      console.error('worker:error', {
        jobId: job.id,
        err: err instanceof Error ? err.message : String(err),
      })
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
    console.log('worker:connections_snapshot', { count: rows.length, pageIds: rows.map(r => r.pageId) })
  } catch (e: unknown) {
    console.warn(
      'worker:connections_snapshot_error',
      e instanceof Error ? e.message : String(e),
    )
  }
})()

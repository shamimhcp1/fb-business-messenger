import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'

const connection = redis.options as any

export const webhookQueue = new Queue('webhooks', { connection })
export const outboundQueue = new Queue('outbound', { connection })


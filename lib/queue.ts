import { Queue } from 'bullmq'
import { redis } from '@/lib/redis'
import type { RedisOptions } from 'ioredis'

const connection: RedisOptions = redis.options

export const webhookQueue = new Queue('webhooks', { connection })
export const outboundQueue = new Queue('outbound', { connection })


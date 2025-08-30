import { pgTable, text, integer, timestamp, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('owner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  tenantId: text('tenant_id').notNull(),
})

export const facebookConnections = pgTable('facebook_connections', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  pageId: text('page_id').notNull(),
  pageName: text('page_name').notNull(),
  pageTokenEnc: text('page_token_enc').notNull(),
  connectedByUserId: text('connected_by_user_id').notNull(),
  status: text('status').notNull().default('active'),
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
}, (table) => ({
  uniqTenantPage: uniqueIndex('facebook_connections_tenant_page_idx').on(table.tenantId, table.pageId),
}))

export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  pageId: text('page_id').notNull(),
  psid: text('psid').notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  unreadCount: integer('unread_count').default(0).notNull(),
  assigneeUserId: text('assignee_user_id'),
  status: text('status').notNull().default('open'),
}, (table) => ({
  uniqConversation: uniqueIndex('conversations_tenant_page_psid_idx').on(table.tenantId, table.pageId, table.psid),
}))

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  direction: text('direction').notNull(), // inbound | outbound
  mid: text('mid').notNull().unique(),
  text: text('text'),
  attachmentsJson: text('attachments_json'),
  timestamp: timestamp('timestamp').notNull(),
  deliveryState: text('delivery_state'),
  readAt: timestamp('read_at'),
})

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  payloadJson: text('payload_json').notNull(),
  status: text('status').notNull().default('pending'),
  processedAt: timestamp('processed_at'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})


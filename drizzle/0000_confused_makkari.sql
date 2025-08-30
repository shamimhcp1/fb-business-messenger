CREATE TABLE IF NOT EXISTS "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"page_id" text NOT NULL,
	"psid" text NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"assignee_user_id" text,
	"status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "facebook_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"page_id" text NOT NULL,
	"page_name" text NOT NULL,
	"page_token_enc" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"direction" text NOT NULL,
	"mid" text NOT NULL,
	"text" text,
	"attachments_json" text,
	"timestamp" timestamp NOT NULL,
	"delivery_state" text,
	"read_at" timestamp,
	CONSTRAINT "messages_mid_unique" UNIQUE("mid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload_json" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_tenant_page_psid_idx" ON "conversations" USING btree ("tenant_id","page_id","psid");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "facebook_connections_tenant_page_idx" ON "facebook_connections" USING btree ("tenant_id","page_id");
CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamp DEFAULT now() NOT NULL,
  tenant_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS facebook_connections (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  page_id text NOT NULL,
  page_name text NOT NULL,
  page_token_enc text NOT NULL,
  connected_by_user_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  connected_at timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS facebook_connections_tenant_page_idx ON facebook_connections(tenant_id, page_id);

CREATE TABLE IF NOT EXISTS conversations (
  id text PRIMARY KEY,
  tenant_id text NOT NULL,
  page_id text NOT NULL,
  psid text NOT NULL,
  last_message_at timestamp DEFAULT now() NOT NULL,
  unread_count integer DEFAULT 0 NOT NULL,
  assignee_user_id text,
  status text NOT NULL DEFAULT 'open'
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_tenant_page_psid_idx ON conversations(tenant_id, page_id, psid);

CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  conversation_id text NOT NULL,
  direction text NOT NULL,
  mid text NOT NULL UNIQUE,
  text text,
  attachments_json text,
  timestamp timestamp NOT NULL,
  delivery_state text,
  read_at timestamp
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  payload_json text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_at timestamp,
  error text,
  created_at timestamp DEFAULT now() NOT NULL
);


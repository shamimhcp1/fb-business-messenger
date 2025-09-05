# Facebook Business Messenger SaaS (FOSS Stack)

Multi-tenant inbox for Facebook Pages built with free and open-source tools: Next.js 15, Tailwind v4, shadcn/ui, Postgres, Redis, BullMQ, and S3-compatible object storage (Cloudflare R2 or self-hosted alternatives). Real-time messaging, reliable webhook ingestion, and secure token handling.

## Goals & Intent

- Provide a hosted SaaS where teams connect Facebook Pages and manage conversations in one place.
- Multi-tenant RBAC, real-time updates, resilient webhook processing, and compliant message sending (24‑hour policy + tags).
- Operable on Coolify with only FOSS building blocks. Cloudflare R2 is supported for simplicity; fully OSS storage options are documented.

## Current Status (MVP Progress)

- App: Next.js 15 App Router with shadcn/ui and Tailwind v4.
- Auth: NextAuth Credentials provider (JWT sessions); registration endpoint creates tenant + owner.
- DB: Drizzle ORM over Postgres; initial schema and migration included.
- Redis: Configured (ioredis).
- Queue/Worker: BullMQ worker processes webhook jobs and persists conversations/messages.
- Meta (Facebook) integration:
  - OAuth login + callback to fetch Pages, store encrypted page access tokens, and subscribe to webhooks.
  - Webhook endpoint validates signature and enqueues entries for the worker.
- Inbox APIs: list conversations, get/send messages (with tag enforcement for >24h windows).
- Crypto: AES‑GCM envelope encryption for tokens.

Not yet done (planned): dedicated Socket.io gateway and UI presence/typing, attachments upload via R2, role-based UI guards, observability, rate-limiting and retries hardening, tests.

## Architecture Overview

- Web App (Next.js): UI + route handlers for APIs and OAuth.
- Webhooks: `/api/webhooks/meta` endpoint (signature verification + enqueue work).
- Queues/Workers: BullMQ workers consume jobs (webhook processing, outbound sends, future maintenance tasks) backed by Redis.
- Database: Postgres with Drizzle ORM; tenant scoping baked into tables.
- Realtime: Socket.io with Redis adapter (planned as a standalone gateway service).
- Object Storage: S3-compatible storage for attachments (Cloudflare R2 or OSS alternatives).

## Tech Stack

- UI: Next.js 15, React 19, Tailwind v4, shadcn/ui, next-themes
- API: Next.js route handlers, Zod validation
- DB: Postgres, Drizzle ORM (`drizzle-kit`, `pg`)
- Cache/Queue: Redis, BullMQ
- Crypto: Node `crypto` (AES‑256‑GCM)
- Meta Graph: `axios` calls to Facebook APIs
- Storage: Cloudflare R2 (S3) or OSS S3 (Garage, SeaweedFS, MinIO)

## Data Model (Drizzle tables)

- `tenants`: id, name, created_at
- `users`: id, email, password_hash, role, tenant_id, created_at
- `facebook_connections`: tenant_id + page_id unique, token encrypted
- `conversations`: tenant_id + page_id + psid unique, unread_count, last_message_at
- `messages`: conversation_id, direction, mid unique, text, timestamps
- `webhook_events`: idempotency_key unique, payload_json, status

See `db/schema.ts` and `drizzle/0000_init.sql`.

## API Surface (MVP)

- Auth
  - `POST /api/auth/register` – email, password, tenantName
  - `POST /api/auth/[...nextauth]` – NextAuth (Credentials)
- Facebook Connect
  - `GET /api/meta/login` – redirect to Facebook OAuth
  - `GET /api/meta/callback` – exchange tokens, fetch pages, store page tokens, subscribe webhooks
- Webhooks
  - `GET /api/webhooks/meta` – challenge verification
  - `POST /api/webhooks/meta` – verify signature, enqueue entries
- Inbox
  - `GET /api/inbox/conversations` – filter by `tenantId`, `pageId`, `q`
  - `GET /api/inbox/conversations/:id/messages` – list messages
  - `POST /api/inbox/conversations/:id/messages` – send outbound message (enforces 24h/tag)

## Environment Variables

Required (server):

- `DATABASE_URL` – Postgres connection string
- `REDIS_URL` – Redis URL (e.g., `redis://localhost:6379/0`)
- `NEXTAUTH_SECRET` – NextAuth secret
- `ENCRYPTION_PASS` – symmetric passphrase used to derive key for token encryption
- `NEXT_PUBLIC_BASE_URL` – site origin (used for OAuth redirect)
- `AUTH_TRUST_HOST` – set to `true` when using tunnels or reverse proxies in development

Meta (Facebook):

- `META_APP_ID`
- `META_APP_SECRET`
- `META_VERIFY_TOKEN` – random value you configure in the Facebook App webhook
- `META_API_VERSION` – e.g. `v20.0`

Object Storage (Cloudflare R2 or S3-compatible):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET` (default: `attachments`)

## Local Development

Prerequisites: Node 18+, Postgres, Redis.

1) Install deps

```bash
npm install
```

2) Configure `.env.local`

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/fbm
REDIS_URL=redis://localhost:6379/0
NEXTAUTH_SECRET=change-me
ENCRYPTION_PASS=change-me
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_TRUST_HOST=true
META_APP_ID=...
META_APP_SECRET=...
META_VERIFY_TOKEN=...
META_API_VERSION=v20.0
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=attachments
```

3) Migrate database (Drizzle)

```bash
npm run db:migrate
```

4) Seed a first user (required for Meta connect)

The Meta OAuth callback associates connected Pages to the first user’s tenant. On a fresh database you must seed one user, otherwise the callback redirects with `error=no_user`.

```bash
npx tsx scripts/seed-dev-user.ts
```

You can override the defaults via optional env vars in `.env.local`:

```
SEED_USER_EMAIL=owner@example.com
SEED_USER_PASSWORD=change-me
```

This script is for local/dev usage only.

To remove all data from the database during development:

```bash
npm run db:clear
```

5) Start the app

```bash
npm run dev  # http://localhost:3000
```

6) Start the worker

- The worker is TypeScript (`worker/index.ts`):

```bash
npm run worker
```

7) Webhooks in local dev

- Expose your local server using `localtunnel` (or similar):

```bash
npx localtunnel --port 3000 --subdomain fb-messenger
# Configure Facebook App webhook URL to: https://your-sub.loca.lt/api/webhooks/meta
```

If you access the app via the tunnel URL, ensure `AUTH_TRUST_HOST=true` is set so NextAuth accepts the external host.

## Storage Options

- Cloudflare R2 (managed, free tier, S3‑compatible): recommended for simplicity. See `lib/r2.ts` for client setup.
- Fully OSS alternatives (self‑host on Coolify): Garage or SeaweedFS via their S3 gateways.
- For local dev: MinIO or LocalStack S3.

Note: Presigned upload/download routes are not yet implemented. Next steps include adding a minimal PUT presign endpoint using `@aws-sdk/s3-request-presigner` and uploading attachments before sending via Messenger.

## Realtime (Planned)

- Socket.io gateway service using Redis adapter for multi-instance scaling.
- Namespaces per tenant and rooms per page/conversation.
- Events: `message:new`, `conversation:updated`, `typing:start/stop`, `presence:changed`.

## Security & Compliance

- Webhook: verify `x-hub-signature-256` against `META_APP_SECRET`.
- Token storage: AES‑256‑GCM encryption with `ENCRYPTION_PASS` (rotate by re‑encrypting).
- Outbound messages: enforces 24‑hour window and messaging tags for policy compliance.
- CSRF/state on OAuth is handled by Facebook redirect flow and strict origins; consider adding explicit `state` verification.
- Audit logs and data deletion endpoint are planned.

## Observability (Planned)

- Logging: Pino JSON with request/job IDs.
- Metrics: Prometheus counters for webhook events, queue lag, API latencies.
- Tracing: OpenTelemetry spans across webhook → job → db → emit.

## Deployment (Coolify)

Services:

- `web`: Next.js app
- `worker`: BullMQ worker
- `redis`: single instance
- `postgres`: single instance with backups
- `object storage`: Cloudflare R2 (external) or self‑hosted Garage/SeaweedFS/MinIO

Notes:

- Configure env vars per service. Ensure `web` and `worker` share the same `DATABASE_URL`, `REDIS_URL`, and secrets.
- Set health checks (`/api/healthz` planned; add simple DB/Redis pings).
- Backups: enable Postgres backups; enable bucket versioning if self‑hosting.

## Testing Strategy (Planned)

- Unit: validators, crypto, token flows, graph client wrappers.
- Integration: signed webhook fixtures → queue → worker writes DB.
- E2E: Playwright flows for register/login, connect Facebook (mocked), inbox CRUD.
- Contract: mock Graph API via MSW or a local stub.

## Roadmap / What’s Next

1) Realtime
   - Implement Socket.io gateway + Redis adapter; client integration in inbox UI.
2) Attachments
   - Presigned uploads to R2/OSS; send media via Graph API.
3) Inbox UI
   - Conversation list refinements, filters, assignment, typing indicators, presence.
4) RBAC & Guards
   - Owner/admin/agent/viewer roles; enforce across APIs and UI.
5) Reliability
   - Rate limiting, retries/backoff for sends; dead-letter queue; idempotency keys.
6) Observability
   - Pino logs, metrics (Prometheus), traces (OTel), alerting.
7) Security
   - Audit logs, data deletion endpoint, key rotation procedure.
8) Facebook App Review
   - Permissions: `pages_show_list`, `pages_manage_metadata`, `pages_read_engagement`, `pages_messaging`; screencast and test users.
9) Deployment
   - Coolify: production config, HTTPS, backups, runbooks.

## Contributing

Issues and PRs are welcome. Please include clear steps to reproduce and keep changes focused. For larger features, open an issue first to discuss scope and approach.

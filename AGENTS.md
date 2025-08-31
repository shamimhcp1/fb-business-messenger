# AGENTS

This file provides guidance for contributors and coding agents working in this repository.

## Stack Overview
- Next.js 15 with App Router and Turbopack
- Tailwind CSS v4 and shadcn/ui for styling
- Postgres database using Drizzle ORM
- Redis and BullMQ for queue and worker processing
- Node 18+ runtime

## Development Workflow
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env.local` (see `README.md` for the full list).
3. Apply database migrations:
   ```bash
   npm run db:migrate
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Run the worker in a separate process:
   ```bash
   npx tsx worker/index.ts
   ```
6. For local webhook testing, expose port 3000 with a tunneling tool (e.g., `npx localtunnel --port 3000 --subdomain antorbon`).

## Coding Guidelines
- Use TypeScript for all application and worker code.
- Maintain multi-tenant awareness (tenant IDs scoped across tables and APIs).
- Validate Meta (Facebook) webhook signatures and adhere to the 24-hour messaging policy.
- Encrypt stored tokens using AES‑GCM with the `ENCRYPTION_PASS` environment variable.
- Keep pull requests focused and document any new environment variables or migration steps.

## Programmatic Checks
Run the lint script before committing:
```bash
npm run lint
```


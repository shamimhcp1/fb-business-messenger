import { config as loadEnv } from 'dotenv'
import { existsSync } from 'node:fs'
import type { Config } from 'drizzle-kit'

// Load environment variables so `drizzle-kit` has access to the database URL.
// Prefer a local env file when present, otherwise fall back to `.env`.
const envFile = existsSync('.env.local') ? '.env.local' : '.env'
loadEnv({ path: envFile })

const connectionString = process.env.DATABASE_URL

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Drizzle will error if the connection string is undefined.
    url: connectionString!,
  },
} satisfies Config


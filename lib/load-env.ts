import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

// Idempotent loader for local development. Next.js loads env for the web app,
// but scripts/workers need to explicitly load .env.local.
if (!(global as any).__ENV_LOADED) {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    loadEnv({ path: envLocal })
  } else {
    loadEnv()
  }
  ;(global as any).__ENV_LOADED = true
}


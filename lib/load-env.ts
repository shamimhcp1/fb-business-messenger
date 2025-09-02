import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

declare global {
  // eslint rule about 'no-var' is not triggered here but TypeScript requires this declaration
  // for augmenting the global scope in CommonJS modules.
  var __ENV_LOADED: boolean | undefined
}

// Idempotent loader for local development. Next.js loads env for the web app,
// but scripts/workers need to explicitly load .env.local.
if (!global.__ENV_LOADED) {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    loadEnv({ path: envLocal })
  } else {
    loadEnv()
  }
  global.__ENV_LOADED = true
}

export {}


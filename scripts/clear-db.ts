import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { sql } from 'drizzle-orm'

async function main() {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    loadEnv({ path: envLocal })
  } else {
    loadEnv()
  }

  const { db } = await import('../db')

  await db.execute(sql`
    TRUNCATE TABLE
      messages,
      conversations,
      facebook_connections,
      user_roles,
      permissions,
      permission_categories,
      roles,
      webhook_events,
      users,
      tenants
    RESTART IDENTITY CASCADE
  `)

  console.log('Cleared all data from database')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

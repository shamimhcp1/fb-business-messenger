import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'

async function main() {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    loadEnv({ path: envLocal })
  } else {
    loadEnv()
  }

  // Import db and schema after env is loaded, so DATABASE_URL is set
  const { db } = await import('../db')
  const { tenants, users } = await import('../db/schema')
  const existing = await db.select().from(users).limit(1)
  if (existing.length) {
    console.log('Users already exist. Skipping seed.')
    console.log({ userId: existing[0].id, tenantId: existing[0].tenantId })
    return
  }

  const tenantId = crypto.randomUUID()
  const userId = crypto.randomUUID()
  const email = process.env.SEED_USER_EMAIL || 'owner@example.com'
  const password = process.env.SEED_USER_PASSWORD || 'password123'
  const passwordHash = await bcrypt.hash(password, 10)

  await db.insert(tenants).values({ id: tenantId, name: 'Antorbon' })
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    role: 'owner',
    tenantId,
  })

  console.log('Seeded dev tenant and user:')
  console.log({ tenantId, userId, email, password })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

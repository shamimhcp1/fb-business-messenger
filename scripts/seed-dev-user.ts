import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'

async function main() {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    loadEnv({ path: envLocal })
  } else {
    loadEnv()
  }

  // Import db and schema after env is loaded, so DATABASE_URL is set
  const { db } = await import('../db')
  const { tenants, users, roles, permissionCategories, permissions, userRoles } = await import('../db/schema')
  const existing = await db.select().from(users).limit(1)
  if (existing.length) {
    const role = await db.select().from(userRoles).where(eq(userRoles.userId, existing[0].id)).limit(1)
    console.log('Users already exist. Skipping seed.')
    console.log({ userId: existing[0].id, tenantId: role[0]?.tenantId })
    return
  }

  const tenantId = crypto.randomUUID()
  const userId = crypto.randomUUID()
  const email = process.env.SEED_USER_EMAIL || 'owner@example.com'
  const password = process.env.SEED_USER_PASSWORD || 'password123'
  const passwordHash = await bcrypt.hash(password, 10)

  await db.insert(tenants).values({ id: tenantId, name: 'Antorbon' })
  await db.insert(users).values({ id: userId, email, passwordHash })
  await db.insert(roles).values([{ name: 'owner', tenantId }, { name: 'admin', tenantId }, { name: 'customer_support', tenantId } ])
  await db.insert(permissionCategories).values({ name: 'general' })
  await db.insert(permissions).values([
    // owner permissions
    {
      name: "manage_users",
      categoryName: "general",
      roleName: "owner",
      tenantId,
    },
    {
      name: "view_inbox",
      categoryName: "general",
      roleName: "owner",
      tenantId,
    },
    {
      name: "view_connections",
      categoryName: "general",
      roleName: "owner",
      tenantId,
    },
    {
      name: "manage_tenant_settings",
      categoryName: "general",
      roleName: "owner",
      tenantId,
    },
    // admin permissions
    {
      name: "manage_users",
      categoryName: "general",
      roleName: "admin",
      tenantId,
    },
    {
      name: "view_inbox",
      categoryName: "general",
      roleName: "admin",
      tenantId,
    },
    {
      name: "view_connections",
      categoryName: "general",
      roleName: "admin",
      tenantId,
    },
    {
      name: "manage_tenant_settings",
      categoryName: "general",
      roleName: "admin",
      tenantId,
    },
    // customer_support permissions
    {
      name: "view_inbox",
      categoryName: "general",
      roleName: "customer_support",
      tenantId,
    },
    {
      name: "view_connections",
      categoryName: "general",
      roleName: "customer_support",
      tenantId,
    },
  ]);
  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    roleName: 'owner',
    tenantId,
    userId,
    email,
    status: 'active',
  })

  console.log('Seeded dev tenant, user and permissions:')
  console.log({ tenantId, userId, email })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

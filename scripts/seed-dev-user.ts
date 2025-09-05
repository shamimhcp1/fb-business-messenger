import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

async function main() {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    loadEnv({ path: envLocal })
  } else {
    loadEnv()
  }

  // Import db and schema after env is loaded, so DATABASE_URL is set
  const { db } = await import('../db')
  const {permissionCategories } = await import('../db/schema')
  await db
    .insert(permissionCategories)
    .values({ name: "general" })
    .onConflictDoNothing();

  console.log("Seeded dev permissionCategories:");
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

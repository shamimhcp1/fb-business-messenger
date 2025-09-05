import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tenants, users, roles, userRoles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(2),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { email, password, tenantName } = parsed.data
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) return NextResponse.json({ error: 'Email in use' }, { status: 409 })
  const tenantId = crypto.randomUUID()
  await db.insert(tenants).values({ id: tenantId, name: tenantName })
  const passwordHash = await bcrypt.hash(password, 10)
  const userId = crypto.randomUUID()
  await db.insert(users).values({ id: userId, email, passwordHash })
  await db.insert(roles).values({ name: 'owner', tenantId })
  await db.insert(userRoles).values({
    id: crypto.randomUUID(),
    roleName: 'owner',
    tenantId,
    userId,
    email,
    status: 'active',
  })
  return NextResponse.json({ ok: true, userId })
}

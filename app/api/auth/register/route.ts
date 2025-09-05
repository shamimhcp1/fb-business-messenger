import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { email, password } = parsed.data

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) return NextResponse.json({ error: 'Email in use' }, { status: 409 })
  
  const passwordHash = await bcrypt.hash(password, 10)
  const userId = crypto.randomUUID()
  await db.insert(users).values({ id: userId, email, passwordHash })
  return NextResponse.json({ ok: true, userId })
}

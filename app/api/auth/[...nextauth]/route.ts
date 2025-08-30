import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

const handler = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const found = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1)
        const user = found[0]
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id
        token.tenantId = (user as any).tenantId
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).userId = token.userId
      ;(session as any).tenantId = token.tenantId
      ;(session as any).role = token.role
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }

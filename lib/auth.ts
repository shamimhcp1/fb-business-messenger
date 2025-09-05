import { NextAuthOptions, Session } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/db'
import { users, userRoles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
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
        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)
        const user = found[0]
        if (!user) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        const role = await db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, user.id))
          .limit(1)
        const userRole = role[0]
        if (!userRole) return null
        return { id: user.id, email: user.email, tenantId: userRole.tenantId, role: userRole.roleName }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; tenantId: string; role: string }
        token.userId = u.id
        token.tenantId = u.tenantId
        token.role = u.role
      }
      return token
    },
    async session({ session, token }) {
      const s = session as Session & {
        userId?: string
        tenantId?: string
        role?: string
      }
      s.userId = token.userId as string | undefined
      s.tenantId = token.tenantId as string | undefined
      s.role = token.role as string | undefined
      if (s.user) {
        if (s.userId) s.user.id = s.userId
        if (s.tenantId) s.user.tenantId = s.tenantId
        if (s.role) s.user.role = s.role
      }
      return s
    },
  },
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV !== 'production',
  secret: process.env.NEXTAUTH_SECRET,
}

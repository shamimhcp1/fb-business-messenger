import { NextAuthOptions, Session } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/db'
import { users } from '@/db/schema'
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
        return { id: user.id, email: user.email }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; email: string; };
        token.userId = u.id
        token.email = u.email
      }
      return token
    },
    async session({ session, token }) {
      const s = session as Session & {
        userId?: string;
        email?: string;
      };
      s.userId = token.userId as string | undefined
      s.email = token.email as string | undefined
      if (s.user) {
        if (s.userId) s.user.id = s.userId
        if (s.email) s.user.email = s.email
      }
      return s
    },
  },
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV !== 'production',
  secret: process.env.NEXTAUTH_SECRET,
}

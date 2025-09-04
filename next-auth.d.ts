import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    tenantId: string
    role: string
  }

  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string
      tenantId: string
      role: string
    }
    userId?: string
    tenantId?: string
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string
    tenantId?: string
    role?: string
  }
}

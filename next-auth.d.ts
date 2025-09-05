import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    email: string
  }

  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string
      email: string
    }
    userId?: string
    email?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string
    email?: string
  }
}

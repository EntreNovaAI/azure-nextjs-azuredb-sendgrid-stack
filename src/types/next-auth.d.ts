import { DefaultSession } from "next-auth"

/**
 * NextAuth Type Extensions
 * Extends the default NextAuth types to include our custom user properties
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      accessLevel: string
      memberSince?: Date
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    accessLevel?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
  }
}

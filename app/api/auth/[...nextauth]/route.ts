import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import { getUserByEmail, updateUserById, createUser, getUserByEmailWithPassword } from "@lib/kysely/repositories/user-repo"
import { verifyPassword } from "@lib/auth/password-utils"

// Export auth options for use in other API routes
export const authOptions: NextAuthOptions = {
  session: { 
    strategy: "jwt" 
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email", 
          placeholder: "your@email.com" 
        },
        password: { 
          label: "Password", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          // Get user with password hash from database
          const user = await getUserByEmailWithPassword(credentials.email)
          
          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          // Check if user has a password (might be OAuth-only user)
          if (!user.password) {
            console.log('User has no password set:', credentials.email)
            return null
          }

          // Verify password
          const isValidPassword = await verifyPassword(credentials.password, user.password)
          
          if (!isValidPassword) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          // Return user object for session (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            accessLevel: user.accessLevel
          }
        } catch (error) {
          console.error('Error during authentication:', error)
          return null
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // v4 specific configuration
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    // Enhance session with user access level
    async session({ session, token, user }) {
      if (session.user?.email) {
        try {
          // Fetch user with access level from database
          const dbUser = await getUserByEmail(session.user.email)
          
          if (dbUser) {
            // Add access level to session with proper typing
            session.user.accessLevel = dbUser.accessLevel || 'free'
            session.user.id = dbUser.id
            session.user.memberSince = dbUser.createdAt
          }
        } catch (error) {
          console.error('Error fetching user access level:', error)
        }
      }
      return session
    },
    
    async jwt({ token, user, account }) {
      // Store user ID in JWT token
      if (user) {
        token.userId = user.id
      }
      return token
    },
    
    // Handle user creation and ensure access level is set
    async signIn({ user, account, profile }) {
      try {
        // Handle Google OAuth sign-in
        if (account?.provider === 'google' && user?.email) {
          // Check if user exists and has access level
          const existingUser = await getUserByEmail(user.email)
          
          // If user exists but doesn't have access level, update them
          if (existingUser && !existingUser.accessLevel) {
            await updateUserById(existingUser.id, { accessLevel: 'free' })
          }

          // If user does not exist, create a minimal record
          if (!existingUser) {
            await createUser({
              email: user.email,
              name: user.name || null,
              image: user.image || null,
              accessLevel: 'free'
            } as any)
          }
        }
        
        // Handle credentials sign-in (vanilla login)
        // For credentials provider, user is already validated in authorize()
        // No additional database operations needed here
        if (account?.provider === 'credentials') {
          // User is already authenticated and validated
          return true
        }
      } catch (error) {
        console.error('Error in signIn callback:', error)
        // Don't block sign-in if there's an error
      }
      return true
    }
  }
}

// Configure NextAuth with the options
const handler = NextAuth(authOptions)

// Export handlers for App Router (NextAuth v4 compatible)
export { handler as GET, handler as POST }

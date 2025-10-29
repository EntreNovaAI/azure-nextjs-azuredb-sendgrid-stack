'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * Auth Provider Component
 * Wraps the application with NextAuth session provider
 * This enables session management throughout the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

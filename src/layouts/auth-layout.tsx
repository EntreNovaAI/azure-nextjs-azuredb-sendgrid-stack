'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@components/shared'
import { getColors } from '@constants/colors'

interface AuthLayoutProps {
  children: ReactNode
  /** Optional: Show back to home link (default: true) */
  showBackLink?: boolean
}

/**
 * Auth Layout Component
 * Specialized layout for authentication pages (login, signup, forgot password)
 * Features centered content with minimal header and optional back link
 * Provides clean, focused UI for auth flows
 * Uses centralized color system from @constants/colors
 */
export function AuthLayout({ 
  children,
  showBackLink = true 
}: AuthLayoutProps) {
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Minimal Header with Theme Toggle and actual logo */}
      <header className="w-full p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* Use actual icon.png instead of emoji */}
          <Image 
            src="/icon.png" 
            alt="EntreNova Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8"
          />
          <span 
            className="text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
            }}
          >
            Azure Next Stack
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Content Area */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Optional Footer with Back Link */}
      {showBackLink && (
        <footer className="w-full p-4 text-center">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </footer>
      )}
    </div>
  )
}


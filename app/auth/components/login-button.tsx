'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@components/ui'

/**
 * Modern Login Button Component
 * Shows login/logout buttons based on authentication state
 * Uses shadcn Button components with theme-aware styling via Tailwind
 * Fully responsive with proper dark mode support via next-themes
 * 
 * Features:
 * - Automatic light/dark mode via next-themes CSS variables
 * - Clean, simple button states (loading, authenticated, unauthenticated)
 * - Responsive text with mobile-friendly labels
 * - Uses Tailwind utilities for all styling
 */
export function LoginButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <Button 
        variant="ghost" 
        size="default"
        disabled
        className="whitespace-nowrap bg-nav text-nav-pill"
      >
        <span className="hidden sm:inline">Loading...</span>
        <span className="sm:hidden">...</span>
      </Button>
    )
  }

  // Show logout button if user is authenticated
  if (session) {
    return (
      <div className="flex items-center gap-2">
        {/* Welcome message - hidden on mobile */}
        <p className="hidden lg:block text-sm text-nav-pill font-medium">
          Welcome, <strong className="text-nav-hover">{session.user?.name || session.user?.email}</strong>!
        </p>
        <Button 
          variant="destructive"
          size="default"
          onClick={() => signOut()}
          className="whitespace-nowrap rounded-full font-semibold uppercase tracking-wide text-sm"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  // Show modern CTA button with theme-aware styling
  // Uses Tailwind classes that automatically respond to dark mode
  return (
    <Button 
      size="default"
      onClick={() => router.push('/auth/signup')}
      className="px-4 sm:px-8 font-bold whitespace-nowrap transition-all hover:scale-105 shadow-lg rounded-full bg-accent hover:bg-accent/90 text-accent-foreground uppercase tracking-wide text-sm"
    >
      <span className="hidden sm:inline">SIGN IN/UP</span>
      <span className="sm:hidden">SIGN IN/UP</span>
    </Button>
  )
}

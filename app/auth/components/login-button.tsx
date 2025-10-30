'use client'

import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Button } from '@components/ui'
import { getColors } from '@constants/colors'

/**
 * Modern Login Button Component
 * Shows login/logout buttons based on authentication state
 * Uses shadcn Button components with theme-aware brand colors
 * Fully responsive with proper dark mode support
 */
export function LoginButton() {
  const { data: session, status } = useSession()
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  
  // Get theme-aware brand colors
  const colors = getColors(resolvedTheme === 'dark')

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <Button 
        variant="ghost" 
        size="default"
        disabled
        className="whitespace-nowrap"
      >
        <span className="hidden sm:inline">Loading...</span>
        <span className="sm:hidden">...</span>
      </Button>
    )
  }

  // Show logout button if user is authenticated
  if (session) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Welcome message - hidden on mobile */}
        <p className="hidden sm:block text-sm text-muted-foreground">
          Welcome, <strong className="text-foreground">{session.user?.name || session.user?.email}</strong>!
        </p>
        <Button 
          variant="destructive"
          size="default"
          onClick={() => signOut()}
          className="whitespace-nowrap"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  // Show modern CTA button with brand colors and proper dark mode support
  return (
    <Button 
      size="default"
      onClick={() => router.push('/auth/signup')}
      className="px-4 sm:px-8 font-bold whitespace-nowrap transition-all hover:scale-105 shadow-lg"
      style={{
        backgroundColor: colors.accent,
        color: resolvedTheme === 'dark' ? colors.background : '#ffffff',
        // Add hover effect via CSS variable
        ['--hover-opacity' as string]: '0.9'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
    >
      <span className="hidden sm:inline">GET STARTED ⚡</span>
      <span className="sm:hidden">START ⚡</span>
    </Button>
  )
}

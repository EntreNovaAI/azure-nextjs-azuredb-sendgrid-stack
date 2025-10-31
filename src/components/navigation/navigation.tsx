'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LoginButton } from '@auth/components'
import { getColors } from '@constants/colors'

/**
 * Navigation Component
 * Displays main navigation with auth-aware menu items
 * Shows protected links only when user is authenticated
 * Uses centralized color system from @constants/colors
 */
export function Navigation() {
  const { data: session } = useSession()
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')

  return (
    // Modern navigation with transparent background and glass effect
    <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 py-4">
      <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
        {/* Logo/Brand with actual icon */}
        <Link href="/" className="no-underline">
          {/* Modern brand with gradient text using brand colors from colors.ts */}
          <h1 
            className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent flex items-center gap-2"
            style={{
              backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
            }}
          >
            {/* Use actual icon.png instead of emoji */}
            <Image 
              src="/icon.png" 
              alt="EntreNova Logo" 
              width={36} 
              height={36} 
              className="w-9 h-9"
            />
            Azure Next Stack
          </h1>
        </Link>

        {/* Navigation Links - uses theme text colors */}
        <div className="flex gap-8">
          <Link href="/" className="text-dark-text-secondary hover:text-dark-text font-medium transition-colors">
            Home
          </Link>
          
          {/* Show protected links only when authenticated */}
          {session && (
            <>
              <Link href="/dashboard" className="text-dark-text-secondary hover:text-dark-text font-medium transition-colors">
                Dashboard
              </Link>
              <Link href="/profile" className="text-dark-text-secondary hover:text-dark-text font-medium transition-colors">
                Profile
              </Link>
            </>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          <LoginButton />
        </div>
      </div>
    </nav>
  )
}

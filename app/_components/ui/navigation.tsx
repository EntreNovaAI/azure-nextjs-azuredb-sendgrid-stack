'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { LoginButton } from '../auth'

/**
 * Navigation Component
 * Displays main navigation with auth-aware menu items
 * Shows protected links only when user is authenticated
 */
export function Navigation() {
  const { data: session } = useSession()

  return (
    // Modern navigation with transparent background and glass effect
    <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 py-4">
      <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
        {/* Logo/Brand */}
        <Link href="/" className="no-underline">
          {/* Modern brand with warm sunset gradient text */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-3xl">🚀</span> Azure Next Stack
          </h1>
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-8">
          <Link href="/" className="text-slate-300 hover:text-white font-medium transition-colors">
            Home
          </Link>
          
          {/* Show protected links only when authenticated */}
          {session && (
            <>
              <Link href="/products" className="text-slate-300 hover:text-white font-medium transition-colors">
                Products
              </Link>
              <Link href="/profile" className="text-slate-300 hover:text-white font-medium transition-colors">
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

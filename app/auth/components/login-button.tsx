'use client'

import { signOut, useSession } from 'next-auth/react'

/**
 * Simple Login Button Component
 * Shows login/logout buttons based on authentication state
 * Directs users to dedicated sign-up page for authentication options
 * Uses brand colors from colors.ts for consistent theming
 */
export function LoginButton() {
  const { data: session, status } = useSession()

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <button className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold cursor-not-allowed bg-white/10 text-white/50" disabled>
        <span className="hidden sm:inline">Loading...</span>
        <span className="sm:hidden">...</span>
      </button>
    )
  }

  // Show logout button if user is authenticated
  if (session) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Welcome message - hidden on mobile */}
        <p className="hidden sm:block text-base text-dark-text-secondary">
          Welcome, <strong className="text-dark-text">{session.user?.name || session.user?.email}</strong>!
        </p>
        <button 
          className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold bg-red-500/90 text-white hover:bg-red-600 transition-all hover:scale-105 whitespace-nowrap" 
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Show modern CTA button with brand colors
  return (
    <button 
      className="px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold bg-gradient-to-r from-brand-accent to-brand-accent hover:opacity-90 text-slate-900 transition-all hover:scale-105 shadow-lg hover:shadow-brand-accent/50 whitespace-nowrap" 
      onClick={() => window.location.href = '/auth/signup'}
    >
      <span className="hidden sm:inline">GET STARTED ⚡</span>
      <span className="sm:hidden">START ⚡</span>
    </button>
  )
}

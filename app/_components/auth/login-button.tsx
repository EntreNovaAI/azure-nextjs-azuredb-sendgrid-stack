'use client'

import { signOut, useSession } from 'next-auth/react'

/**
 * Simple Login Button Component
 * Shows login/logout buttons based on authentication state
 * Directs users to dedicated sign-up page for authentication options
 */
export function LoginButton() {
  const { data: session, status } = useSession()

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <button className="px-6 py-2.5 rounded-lg font-semibold cursor-not-allowed bg-white/10 text-white/50" disabled>
        Loading...
      </button>
    )
  }

  // Show logout button if user is authenticated
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-300">
          Welcome, <strong className="text-white">{session.user?.name || session.user?.email}</strong>!
        </p>
        <button 
          className="px-6 py-2.5 rounded-lg font-semibold bg-red-500/90 text-white hover:bg-red-600 transition-all hover:scale-105" 
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Show modern CTA button if user is not authenticated
  return (
    <button 
      className="px-8 py-2.5 rounded-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 hover:from-yellow-300 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg hover:shadow-yellow-500/50" 
      onClick={() => window.location.href = '/auth/signup'}
    >
      GET STARTED ⚡
    </button>
  )
}

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
      <button className="auth-button loading" disabled>
        Loading...
      </button>
    )
  }

  // Show logout button if user is authenticated
  if (session) {
    return (
      <div className="auth-section">
        <p className="user-info">
          Welcome, <strong>{session.user?.name || session.user?.email}</strong>!
        </p>
        <button 
          className="auth-button logout" 
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Show simple sign up button if user is not authenticated
  return (
    <button 
      className="auth-button login" 
      onClick={() => window.location.href = '/auth/signup'}
    >
      Sign Up / Sign In
    </button>
  )
}

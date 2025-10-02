'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error Page Component
 * Displays when an unhandled error occurs in the application
 * Provides user-friendly error message and recovery options
 */
export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-[600px] text-center bg-white p-12 rounded-xl shadow">
        <div className="text-4xl mb-6">
          ⚠️
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Oops! Something went wrong</h1>
        
        <p className="text-lg text-slate-500 mb-8 leading-relaxed">
          We encountered an unexpected error. Please try again later.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap mb-8">
          <button onClick={reset} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Try Again
          </button>
          <Link href="/" className="bg-slate-100 text-slate-700 border border-slate-200 px-6 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors">
            Go Home
          </Link>
        </div>
        
        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <summary>Error Details (Development Only)</summary>
            <pre className="bg-slate-800 text-slate-200 p-4 rounded text-sm mt-2 overflow-x-auto">{error.message}</pre>
            {error.stack && (
              <pre className="mt-2 max-h-[200px] overflow-y-auto">{error.stack}</pre>
            )}
          </details>
        )}
      </div>
    </div>
  )
}

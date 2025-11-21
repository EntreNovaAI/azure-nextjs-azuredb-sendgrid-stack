'use client'

import Link from 'next/link'
import Image from 'next/image'

/**
 * LoadingState Component
 * Reusable loading state display for pages
 * Uses theme colors from globals.css
 */
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <div className="text-center py-16 px-8">
        <h2 className="text-2xl text-text mb-4">Loading...</h2>
        <p className="text-text/80 text-lg">{message}</p>
      </div>
    </div>
  )
}

/**
 * AuthRequiredState Component
 * Reusable authentication required state for protected pages
 * Includes a friendly dog image and a button to navigate back to the home page
 * Uses theme colors from globals.css
 */
export function AuthRequiredState({ 
  title = "Authentication Required",
  message = "Please sign in to access this content."
}: { 
  title?: string
  message?: string 
}) {
  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <div className="text-center py-16 px-8">
        {/* Dog image - adds friendly, playful touch to auth barrier */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md aspect-3/4 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/dog.jpg"
              alt="Friendly dog waiting to be let in - just like you're waiting to access this content!"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <h2 className="text-2xl text-text mb-4">{title}</h2>
        <p className="text-text/80 text-lg mb-6">{message}</p>
        
        {/* Button to navigate to home page */}
        <Link 
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-semibold bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          Go to Home Page
        </Link>

        {/* Unsplash attribution - required by license */}
        <p className="text-xs text-text/60 mt-8">
          Photo by{' '}
          <a 
            href="https://unsplash.com/@nateman?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text"
          >
            Nathanael Manier
          </a>
          {' '}on{' '}
          <a 
            href="https://unsplash.com/photos/a-brown-and-white-dog-looking-out-of-a-window-b__EuEBmaKA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text"
          >
            Unsplash
          </a>
        </p>
      </div>
    </div>
  )
}

/**
 * AccessNotice Component
 * Reusable notice component for displaying access level information
 * Uses centralized color system from globals.css
 */
export function AccessNotice({ 
  accessLevel, 
  title = "🔐 Protected Content" 
}: { 
  accessLevel: string
  title?: string 
}) {
  return (
    <div className="p-8 rounded-lg text-center border bg-primary/10 border-primary/30">
      <h3 className="text-text mb-2">{title}</h3>
      <p className="text-text">
        This page is only accessible to authenticated users. Your account 
        has <strong>{accessLevel}</strong> access level.
      </p>
    </div>
  )
}

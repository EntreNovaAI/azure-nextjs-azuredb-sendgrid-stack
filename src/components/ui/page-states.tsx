'use client'

import { useTheme } from 'next-themes'
import { getColors } from '@constants/colors'

/**
 * LoadingState Component
 * Reusable loading state display for pages
 * Uses theme colors from colors.ts
 */
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <div className="text-center py-16 px-8">
        <h2 className="text-2xl text-light-text dark:text-dark-text mb-4">Loading...</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">{message}</p>
      </div>
    </div>
  )
}

/**
 * AuthRequiredState Component
 * Reusable authentication required state for protected pages
 * Uses theme colors from colors.ts
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
        <h2 className="text-2xl text-light-text dark:text-dark-text mb-4">{title}</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">{message}</p>
      </div>
    </div>
  )
}

/**
 * AccessNotice Component
 * Reusable notice component for displaying access level information
 * Uses centralized color system from @constants/colors
 */
export function AccessNotice({ 
  accessLevel, 
  title = "🔐 Protected Content" 
}: { 
  accessLevel: string
  title?: string 
}) {
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')
  
  return (
    <div 
      className="p-8 rounded-lg text-center border"
      style={{
        backgroundColor: `${colors.primary}1A`, // 10% opacity
        borderColor: `${colors.primary}4D` // 30% opacity
      }}
    >
      <h3 className="text-light-text dark:text-dark-text mb-2">{title}</h3>
      <p className="text-light-text dark:text-dark-text">
        This page is only accessible to authenticated users. Your account 
        has <strong>{accessLevel}</strong> access level.
      </p>
    </div>
  )
}

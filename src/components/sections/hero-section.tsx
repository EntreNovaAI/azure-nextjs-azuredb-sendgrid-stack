'use client'

import Link from 'next/link'
import { Session } from 'next-auth'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@components/ui'
import { getColors } from '@constants/colors'

interface HeroSectionProps {
  title: string
  subtitle: string
  session: Session | null
  authenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
  unauthenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
  className?: string
}

/**
 * HeroContent type definition
 * Used to configure hero section content for different pages
 * Supports authentication-aware messaging
 */
export interface HeroContent {
  title: string
  subtitle: string
  authenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
  unauthenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
}

/**
 * HeroSection Component
 * Reusable hero section with authentication-aware content
 * Displays different messages and CTAs based on user authentication status
 * Uses centralized color system from @constants/colors
 * Implements mounted state to prevent hydration mismatches
 */
export function HeroSection({
  title,
  subtitle,
  session,
  authenticatedContent,
  unauthenticatedContent,
  // Default to container with center alignment and generous spacing
  className = "text-center py-20 md:py-28"
}: HeroSectionProps) {
  const content = session ? authenticatedContent : unauthenticatedContent
  const { resolvedTheme } = useTheme()
  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Use light theme as default during SSR and initial render to prevent hydration errors
  const colors = getColors(mounted ? resolvedTheme === 'dark' : false)
  
  return (
    <div className={className}>
      {/* Title - large, bold, with brand gradient styling from colors.ts */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
        <span 
          className="bg-gradient-to-r bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
          }}
        >
          {title}
        </span>
      </h1>
      <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
      
      {/* Message and CTA section */}
      <div className="mb-8">
        <p className="text-base md:text-lg mb-8 text-muted-foreground">
          {session ? (
            <>
              Welcome back, <strong style={{ color: colors.primary }}>{session.user?.name || session.user?.email}</strong>! {content.message}
            </>
          ) : (
            content.message
          )}
        </p>
        <Button 
          asChild
          size="lg"
          className="hover:opacity-90 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
          }}
        >
          <Link href={content.buttonHref}>
            {content.buttonText}
          </Link>
        </Button>
      </div>
    </div>
  )
}

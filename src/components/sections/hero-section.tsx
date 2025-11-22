'use client'

import Link from 'next/link'
import { Session } from 'next-auth'
import { Button } from '@components/ui'
import DotGrid from '@reactBits/DotGrid'
import { ShinyText } from '@reactBits/ShinyText'

interface HeroSectionProps {
  grid?: boolean
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
 * Uses Tailwind CSS custom properties that automatically adapt to light/dark mode
 * DotGrid background automatically reads theme colors from CSS variables
 */
export function HeroSection({
  grid=true,
  title,
  subtitle,
  session,
  authenticatedContent,
  unauthenticatedContent,
  // Default to container with center alignment and generous spacing
  className = "text-center py-20 md:py-28"
}: HeroSectionProps) {
  const content = session ? authenticatedContent : unauthenticatedContent
  
  return (
    /* 1. Main Wrapper: Needs 'relative' to act as the anchor for the absolute background */
    <div className="relative w-full overflow-hidden h-full flex items-center justify-center">
      
      {/* 2. Background Layer: Absolute positioned, full width/height, low z-index */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {/* DotGrid background - automatically uses theme colors from CSS variables */}
        {grid && <DotGrid
          dotSize={5}
          gap={15}
          proximity={120}
          shockRadius={150}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />}
      </div>

      {/* 2.5. Rounded square background - positioned between dots and text for readability */}
      <div className="absolute inset-0 z-5 flex items-center justify-center px-4 md:px-0">
        <div className="w-full md:w-1/3 max-w-5xl h-[50vh] rounded-3xl bg-background/80 backdrop-blur-sm border border-primary/50 shadow-2xl"></div>
      </div>
  
      {/* 3. Content Layer: Relative positioned with higher z-index to sit ON TOP */}
      <div className={`relative z-10 ${className}`}>
        {/* Title with shiny text animation */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
          <ShinyText>
            {title}
          </ShinyText>
        </h1>
        
        {/* Subtitle using text-text from theme */}
        <p className="text-lg md:text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-80">
          {subtitle}
        </p>
        
        {/* Message and CTA section */}
        <div className="mb-8">
          <p className="text-base md:text-lg mb-8 opacity-70">
            {session ? (
              <>
                Welcome back, <strong className="text-primary font-bold">{session.user?.name || session.user?.email}</strong>! {content.message}
              </>
            ) : (
              content.message
            )}
          </p>
          
          {/* CTA Button with gradient background using theme colors */}
          <Button 
            asChild
            size="lg"
            className="bg-linear-to-r from-primary via-secondary to-accent hover:opacity-90 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Link href={content.buttonHref}>
              {content.buttonText}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

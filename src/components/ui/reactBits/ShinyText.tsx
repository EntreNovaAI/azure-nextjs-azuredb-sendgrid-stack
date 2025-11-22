'use client'

import { ReactNode } from 'react'

interface ShinyTextProps {
  children: ReactNode
  className?: string
}

/**
 * ShinyText Component
 * Creates an animated shiny/shimmer effect on text
 * Uses CSS animations to create a moving gradient shine effect
 * Based on reactbits.dev/text-animations/shiny-text
 * Uses theme colors from CSS variables for automatic light/dark mode support
 * Animation is defined in globals.css
 */
export function ShinyText({ children, className = '' }: ShinyTextProps) {
  return (
    <span 
      className={`relative inline-block ${className}`}
      style={{
        background: 'linear-gradient(110deg, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-accent) 100%)',
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'shiny 5s ease-in-out infinite',
      }}
    >
      {children}
    </span>
  )
}

export default ShinyText


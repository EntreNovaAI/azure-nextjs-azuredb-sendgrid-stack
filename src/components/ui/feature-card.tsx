'use client'

import { useTheme } from 'next-themes'
import { getColors } from '@constants/colors'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

/**
 * FeatureCard Component
 * Reusable card component for displaying features with icon, title, and description
 * Used in hero sections and feature showcases
 * Uses centralized color system from @constants/colors
 */
export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')
  
  return (
    // Modern glass-morphism card with theme-aware colors
    <div className="group bg-dark-bg-alt/40 dark:bg-dark-bg-alt/40 backdrop-blur-xl p-8 rounded-2xl border border-dark-text-secondary/30 hover:border-dark-text-secondary/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-dark-bg-alt/50">
      {/* Large icon with hover animation */}
      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{icon}</div>
      
      {/* Title with brand gradient on hover - uses dynamic colors from colors.ts */}
      <h3 
        className="text-2xl font-bold text-dark-text mb-4 transition-all"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundImage = `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
          e.currentTarget.classList.add('bg-clip-text', 'text-transparent')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundImage = ''
          e.currentTarget.classList.remove('bg-clip-text', 'text-transparent')
        }}
      >
        {title}
      </h3>
      
      {/* Description text using theme colors */}
      <p className="text-dark-text-secondary leading-relaxed">{description}</p>
    </div>
  )
}

'use client'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

/**
 * FeatureCard Component
 * Reusable card component for displaying features with icon, title, and description
 * Used in hero sections and feature showcases
 * Uses centralized color system from globals.css
 */
export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    // Modern glass-morphism card with theme-aware colors
    <div className="group bg-background/40 backdrop-blur-xl p-8 rounded-2xl border border-text/10 hover:border-text/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-background/20">
      {/* Large icon with hover animation */}
      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
      
      {/* Title with brand gradient on hover */}
      <h3 className="text-2xl font-bold text-text mb-4 transition-all duration-300 hover:bg-linear-to-r hover:from-primary hover:via-secondary hover:to-accent hover:bg-clip-text hover:text-transparent">
        {title}
      </h3>
      
      {/* Description text using theme colors */}
      <p className="text-text/80 leading-relaxed">{description}</p>
    </div>
  )
}

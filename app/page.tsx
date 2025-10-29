'use client'

import { useSession } from 'next-auth/react'
import { MainLayout } from '@/src/layouts'
import { HeroSection, type HeroContent } from '@components/ui'

/**
 * Homepage hero content configuration
 * Contains title, subtitle, and authentication-specific messaging
 */
const homeHeroContent: HeroContent = {
  title: "🚀 Azure Next Stack",
  subtitle: "Secure subscription platform with Stripe integration",
  authenticatedContent: {
    message: "",
    buttonText: "Product Dashboard →",
    buttonHref: "/dashboard"
  },
  unauthenticatedContent: {
    message: "Sign in to access our premium subscription plans",
    buttonText: "Explore Products →", 
    buttonHref: "/landing-page"
  }
}

/**
 * Home Page Component
 * Simple home page with hero section and CTA
 * Directs users to the main landing page with plans and features
 * Uses MainLayout for consistent structure with navbar and footer
 */
export default function Home() {
  const { data: session } = useSession()

  return (
    <MainLayout containerClass="">
      <div className="min-h-screen">
        {/* Hero Section - with gradient and glow effects using brand colors */}
        <div className="relative overflow-hidden">
          {/* Gradient background with glow effects - uses brand colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-brand-secondary/5 to-transparent dark:from-brand-primary/20 dark:via-brand-secondary/10"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-[1200px] mx-auto px-4">
            <HeroSection
              title={homeHeroContent.title}
              subtitle={homeHeroContent.subtitle}
              session={session}
              authenticatedContent={homeHeroContent.authenticatedContent}
              unauthenticatedContent={homeHeroContent.unauthenticatedContent}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { MainLayout } from '@/src/layouts'
import { HeroSection, type HeroContent } from '@components/sections'

/**
 * Homepage hero content configuration
 * Contains title, subtitle, and authentication-specific messaging
 */
const homeHeroContent: HeroContent = {
  title: "[SaaS]",
  subtitle: "[Description]",
  authenticatedContent: {
    message: "",
    buttonText: "Product Dashboard →",
    buttonHref: "/dashboard"
  },
  unauthenticatedContent: {
    message: "",
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
        <div className="relative">
          <HeroSection
            title={homeHeroContent.title}
            subtitle={homeHeroContent.subtitle}
            session={session}
            authenticatedContent={homeHeroContent.authenticatedContent}
            unauthenticatedContent={homeHeroContent.unauthenticatedContent}
            className="text-center max-w-5xl mx-auto px-4 relative z-10 flex flex-col justify-center min-h-[calc(100vh)]"
          />
        </div>
      </div>
    </MainLayout>
  )
}

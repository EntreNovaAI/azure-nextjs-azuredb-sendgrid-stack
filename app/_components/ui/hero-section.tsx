import Link from 'next/link'
import { Session } from 'next-auth'

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

// Homepage hero content
export const homeHeroContent: HeroContent = {
  title: "🚀 Azure Next Stack",
  subtitle: "Secure subscription platform with Stripe integration",
  authenticatedContent: {
    message: "",
    buttonText: "View Premium Products →",
    buttonHref: "/products"
  },
  unauthenticatedContent: {
    message: "Sign in to access our premium subscription plans",
    buttonText: "Explore Products →", 
    buttonHref: "/products"
  }
}

// Products page hero content (example for future use)
export const productsHeroContent: HeroContent = {
  title: "🛍️ Premium Products",
  subtitle: "Choose the perfect plan for your needs",
  authenticatedContent: {
    message: "Select your subscription plan below.",
    buttonText: "View Calculator →",
    buttonHref: "#calculator"
  },
  unauthenticatedContent: {
    message: "Sign in to purchase and access premium features.",
    buttonText: "Sign In →",
    buttonHref: "/api/auth/signin"
  }
}

/**
 * HeroSection Component
 * Reusable hero section with authentication-aware content
 * Displays different messages and CTAs based on user authentication status
 */
export function HeroSection({
  title,
  subtitle,
  session,
  authenticatedContent,
  unauthenticatedContent,
  // Tailwind migration: default to container with center alignment and generous spacing
  className = "text-center py-20 md:py-28"
}: HeroSectionProps) {
  const content = session ? authenticatedContent : unauthenticatedContent
  
  return (
    <div className={className}>
      {/* Title - large, bold, with warm sunset gradient styling */}
      <h1 className="text-6xl md:text-8xl font-extrabold mb-6 leading-tight">
        <span className="bg-gradient-to-r from-orange-200 via-pink-200 to-yellow-200 bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
      <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
      
      {/* Message and CTA section */}
      <div className="mb-8">
        <p className="text-lg mb-8 text-slate-400">
          {session ? (
            <>
              Welcome back, <strong className="text-orange-400">{session.user?.name || session.user?.email}</strong>! {content.message}
            </>
          ) : (
            content.message
          )}
        </p>
        <Link 
          href={content.buttonHref}
          className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-500 text-white text-lg rounded-xl hover:from-orange-600 hover:via-pink-600 hover:to-yellow-600 transition-all font-bold shadow-2xl hover:shadow-orange-500/50 hover:scale-105"
        >
          {content.buttonText}
        </Link>
      </div>
    </div>
  )
}

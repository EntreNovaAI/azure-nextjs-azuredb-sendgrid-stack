'use client'

import { useSession } from 'next-auth/react'
import { ProductCard, FeaturesSection, HeroSection, homeHeroContent } from '@/app/_components/ui'
import { products } from '@/app/_data/products'
import { heroFeatures } from '@/app/_data/features'

/**
 * Home Page Component
 * Landing page showcasing products and authentication
 * Creates clear path to products and checkout flow
 */
export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* Hero Section - with warm sunset gradient and glow effects */}
      <div className="relative overflow-hidden">
        {/* Gradient background with glow effects - warm sunset colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-pink-900/10 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"></div>
        
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

      {/* Product Preview Section - with dark cards on darker background */}
      <div className="relative py-20">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent"></div>
        
        <div className="relative max-w-[1200px] mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-orange-200 via-pink-200 to-yellow-200 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Select the perfect plan for your needs. All plans include secure payment processing and instant access.
          </p>
          
          {/* Modern grid with cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                features={product.features}
                price={product.price}
                variant={product.variant}
                productId={product.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section - with warm glow effects */}
      <div className="relative py-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="relative max-w-[1200px] mx-auto px-4">
          <FeaturesSection features={heroFeatures} />
        </div>
      </div>
    </div>
  )
}

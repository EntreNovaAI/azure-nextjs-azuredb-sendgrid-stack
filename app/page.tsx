'use client'

import { useSession } from 'next-auth/react'
import { MainLayout } from '@/src/layouts'
import { ProductCard, FeaturesSection, HeroSection, homeHeroContent, Card, CardContent } from '@components/ui'
import { products } from '@/app/products/_data/products'
import { heroFeatures } from '@src/data/features'

/**
 * Home Page Component
 * Landing page showcasing products and authentication
 * Creates clear path to products and checkout flow
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

        {/* Product Preview Section */}
        <div className="relative py-20">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent"></div>
          
          <div className="relative max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text ">
              Choose Your Plan
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
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

        {/* Features Section - with glow effects using brand colors */}
        <div className="relative py-20">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/10 rounded-full blur-3xl"></div>
          <div className="relative max-w-[1200px] mx-auto px-4">
            <FeaturesSection features={heroFeatures} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

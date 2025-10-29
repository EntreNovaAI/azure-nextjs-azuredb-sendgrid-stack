'use client'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import { MainLayout } from '@/src/layouts'
import { Button, Card, CardContent, Separator, ProductCard, FeaturesSection } from '@components/ui'
import { getColors } from '@constants/colors'
import { products } from '@/app/(product)/dashboard/_data/products'
import { heroFeatures } from '@src/data/features'

/**
 * Landing Page
 * Full marketing page with tweet-sized selling points, product plans, and features
 * Shows available subscription tiers and platform capabilities
 * Uses MainLayout for consistent structure
 */
export default function LandingPage() {
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero Section - with gradient and glow effects */}
        <div className="relative overflow-hidden py-20 md:py-32">
          {/* Background glow effects using brand colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-brand-secondary/5 to-transparent dark:from-brand-primary/20 dark:via-brand-secondary/10"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            {/* Emoji icon for visual appeal */}
            <div className="text-6xl md:text-7xl mb-6">🚀</div>
            
            {/* Hero title with gradient */}
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
              }}
            >
              Ship Faster
            </h1>
            
            {/* Tweet-sized description: 140 chars */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Azure + Next.js + Stripe. Production-ready stack. Deploy in minutes, not months.
            </p>
            
            {/* CTA button - scrolls to plans section */}
            <div className="flex justify-center">
              <Link href="#plans">
                <Button size="lg" className="text-lg px-8 py-6">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>



        <Separator className="max-w-6xl mx-auto" />

        {/* Features Section */}
        <div className="relative py-20">
          {/* Glow effects using brand colors */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-[1200px] mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Everything you need to build and scale your business
            </p>
            <FeaturesSection features={heroFeatures} />
          </div>
        </div>
        {/* Product Plans Section - anchor target for hero CTA */}
        <div id="plans" className="relative py-20 scroll-mt-20">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent"></div>
          
          <div className="relative max-w-[1200px] mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text ">
              Choose Your Plan
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Select the perfect plan for your needs. All plans include secure payment processing and instant access.
            </p>
            
            {/* Product cards grid */}
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


        <Separator className="max-w-6xl mx-auto" />

        {/* Final CTA Section */}
        <div className="relative py-20">
          {/* Glow effect */}
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
              }}
            >
              Ready to Build?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Stop configuring. Start shipping.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-12 py-6">
                Start Free →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


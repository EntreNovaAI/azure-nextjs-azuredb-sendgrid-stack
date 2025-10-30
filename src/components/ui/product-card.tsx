'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { getColors } from '@constants/colors'

interface ProductCardProps {
  title: string
  description: string
  features: string[]
  price: string
  variant?: 'default' | 'basic' | 'premium'
  productId?: string // Add product ID for checkout
}

/**
 * ProductCard Component
 * Reusable card component for displaying product/subscription tiers
 * Supports different styling variants and handles purchase flow
 * Uses centralized color system from @constants/colors
 */
export function ProductCard({ 
  title, 
  description, 
  features, 
  price, 
  variant = 'default',
  productId 
}: ProductCardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const { resolvedTheme } = useTheme()
  const colors = getColors(resolvedTheme === 'dark')
  
  // Variant-specific styling using dynamic colors
  const variantClasses = variant === 'default' ? 'border-border' : ''
  
  // Dynamic border and shadow colors based on variant
  const borderStyle = variant === 'premium' 
    ? { borderColor: `${colors.primary}80`, boxShadow: `0 4px 20px ${colors.primary}33, 0 0 40px ${colors.primary}66` }
    : variant === 'basic'
    ? { borderColor: `${colors.secondary}80`, boxShadow: `0 4px 20px ${colors.secondary}33, 0 0 40px ${colors.secondary}66` }
    : {}
  
  const isFree = price === 'Free'
  
  // Handle purchase button click
  const handlePurchase = async () => {
    // If not authenticated, redirect to login
    if (!session) {
      router.push('/api/auth/signin')
      return
    }
    
    // If it's a free plan, just show success (or redirect to dashboard)
    if (isFree) {
      alert('Free plan activated! You now have access to basic features.')
      return
    }
    
    // For paid plans, redirect to checkout with product selection
    if (productId) {
      setLoading(true)
      try {
        // Store the selected product in sessionStorage for checkout
        sessionStorage.setItem('selectedProduct', productId)
        router.push('/checkout')
      } catch (error) {
        console.error('Error starting checkout:', error)
        setLoading(false)
      }
    }
  }
  
  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:scale-[1.02] ${variantClasses} flex flex-col h-full border`}
      style={borderStyle}
    >
      {/* Gradient overlay for premium effect - uses dynamic colors */}
      {variant === 'premium' && (
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
          style={{ backgroundColor: `${colors.primary}33` }}
        />
      )}
      {variant === 'basic' && (
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
          style={{ backgroundColor: `${colors.secondary}33` }}
        />
      )}
      
      {/* Premium badge - uses dynamic gradient with responsive positioning */}
      {variant === 'premium' && (
        <div 
          className="absolute top-2 right-2 lg:top-4 lg:right-4 text-white text-xs font-bold px-3 py-1 rounded-full z-10"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
          }}
        >
          POPULAR
        </div>
      )}
      
      {/* Card header with title and description - extra top padding to avoid badge overlap on smaller screens */}
      <CardHeader className={`relative z-10 ${variant === 'premium' ? 'pt-12 lg:pt-6' : ''}`}>
        <CardTitle className="text-2xl flex items-center gap-2">
          {variant === 'premium' && '📱'}
          {variant === 'basic' && '⭐'}
          {variant === 'default' && '🚀'}
          {title}
        </CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      
      {/* Features list - grows to fill available space */}
      <CardContent className="flex-grow relative z-10">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm text-muted-foreground">
              <span className="text-green-500 dark:text-green-400 mr-3 mt-0.5 text-lg">✅</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      {/* Price and CTA button - stays at bottom */}
      <CardFooter className="flex-col relative z-10 pt-6 border-t">
        <div className="text-4xl font-bold text-center mb-1">
          {price}
        </div>
        {!isFree && (
          <div className="text-sm text-muted-foreground text-center mb-6">/month</div>
        )}
        
        <Button 
          onClick={handlePurchase}
          disabled={loading}
          className="w-full hover:opacity-90"
          style={
            !loading && variant === 'premium' 
              ? { backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, ${colors.primary})` }
              : !loading && variant === 'basic'
              ? { backgroundImage: `linear-gradient(to right, ${colors.secondary}, ${colors.accent})` }
              : undefined
          }
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              {isFree ? 'Get Started' : 
               !session ? 'Sign In to Purchase' : 
               'Sign In to Purchase'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

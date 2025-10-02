'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

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
  
  // Modern glass-morphism card design with gradient borders
  const baseCard = 'bg-slate-800/50 backdrop-blur-xl p-8 rounded-2xl border-2 transition-all hover:scale-[1.02] hover:shadow-2xl flex flex-col h-full relative overflow-hidden'
  
  // Different glow effects and borders for each variant - warm sunset colors
  const variantStyles = 
    variant === 'premium' 
      ? 'border-orange-500/50 shadow-orange-500/20 hover:shadow-orange-500/40' 
      : variant === 'basic' 
      ? 'border-pink-500/50 shadow-pink-500/20 hover:shadow-pink-500/40' 
      : 'border-slate-600/50 shadow-slate-500/20'
  
  const cardClass = `${baseCard} ${variantStyles}`
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
    <div className={cardClass}>
      {/* Gradient overlay for premium effect - warm sunset colors */}
      {variant === 'premium' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
      )}
      {variant === 'basic' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
      )}
      
      {/* Premium badge */}
      {variant === 'premium' && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          POPULAR
        </div>
      )}
      
      {/* Card header with title and description */}
      <div className="mb-6 relative z-10">
        <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
          {variant === 'premium' && '📱'}
          {variant === 'basic' && '⭐'}
          {variant === 'default' && '🚀'}
          {title}
        </h3>
        <p className="text-slate-300 leading-relaxed">{description}</p>
      </div>
      
      {/* Features list - grows to fill available space */}
      <div className="flex-grow mb-6 relative z-10">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-slate-300">
              <span className="text-green-400 mr-3 mt-0.5 text-lg">✅</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Price and CTA button - stays at bottom */}
      <div className="mt-auto pt-6 border-t border-slate-700/50 relative z-10">
        <div className="text-4xl font-bold text-white text-center mb-1">
          {price}
        </div>
        {!isFree && (
          <div className="text-sm text-slate-400 text-center mb-6">/month</div>
        )}
        
        <button 
          onClick={handlePurchase}
          disabled={loading}
          className={`w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-bold transition-all ${
            loading ? 'bg-slate-600 cursor-not-allowed text-slate-400' : 
            variant === 'premium' ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-orange-600 hover:from-orange-600 hover:via-pink-600 hover:to-orange-700 text-white shadow-lg hover:shadow-orange-500/50 hover:scale-105' :
            variant === 'basic' ? 'bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-pink-500/50 hover:scale-105' :
            'bg-slate-700 hover:bg-slate-600 text-white hover:scale-105'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <>
              {isFree ? 'Get Started' : 
               !session ? 'Sign In to Purchase' : 
               'Sign In to Purchase'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from '@components/ui'
import { getUpgradePreviewAction, upgradeSubscriptionAction, scheduleDowngradeAction, createBillingPortalAction } from '@lib/stripe/stripe-actions'
import { loadStripe } from '@stripe/stripe-js'
import type { Product } from '@constants/products'

interface ProductCardProps {
  product: Product  // Single product object containing all product data
  price?: string  // Optional price override (fetched from Stripe)
  userAccessLevel?: string  // Current user's access level for comparison
}

/**
 * ProductCard Component
 * Reusable card component for displaying product/subscription tiers
 * Supports different styling variants and handles purchase flow
 * Now accepts a single product object for cleaner API
 */
export function ProductCard({ 
  product,
  price,
  userAccessLevel
}: ProductCardProps) {
  // Extract product properties for easier access
  const { title, description, features, variant = 'default', id: productId } = product
  
  // Use provided price or default to 'Free' for free tier
  const finalPrice = price || 'Free'
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  
  // Variant-specific styling using dynamic colors
  const variantClasses = variant === 'default' ? 'border-border' : ''
  
  // Dynamic border and shadow colors based on variant
  // Using Tailwind classes for theming support instead of inline styles
  const getCardStyles = () => {
    if (variant === 'premium') {
      return 'border-primary/80 shadow-[0_4px_20px_rgba(var(--color-primary),0.2),0_0_40px_rgba(var(--color-primary),0.4)]'
    }
    if (variant === 'basic') {
      return 'border-secondary/80 shadow-[0_4px_20px_rgba(var(--color-secondary),0.2),0_0_40px_rgba(var(--color-secondary),0.4)]'
    }
    return ''
  }
  
  const isFree = finalPrice === 'Free'
  
  // Check if this is the user's current plan
  // Handle both 'free' and 'default' as equivalent for the free plan
  const isCurrentPlan = !!(userAccessLevel && (
    variant === userAccessLevel || 
    (userAccessLevel === 'free' && variant === 'default') ||
    (userAccessLevel === 'default' && variant === 'default')
  ))
  
  // Handle purchase/plan change click
  const handlePurchase = async () => {
    // Don't allow action if this is the current plan
    if (isCurrentPlan) {
      return
    }
    
    // If not authenticated, redirect to signup page
    // Use the custom signup page route, not NextAuth API route
    if (!session) {
      router.push('/auth/signup')
      return
    }
    
    // If it's a free plan, just show success (or redirect to dashboard)
    if (isFree) {
      alert('Free plan activated! You now have access to basic features.')
      return
    }
    
    // Determine intent: new subscription vs upgrade vs downgrade
    const targetPlan = variant // 'basic' | 'premium' | 'default'
    const currentPlan = userAccessLevel // 'free' | 'basic' | 'premium'

    // If user has no paid plan yet, route to checkout (new subscription only lives in Checkout)
    if (!currentPlan || currentPlan === 'free') {
      if (productId) {
        setLoading(true)
        try {
          sessionStorage.setItem('selectedProduct', productId)
          router.push('/checkout')
        } catch (error) {
          console.error('Error starting checkout:', error)
          setLoading(false)
        }
      }
      return
    }

    // Handle downgrade: premium -> basic is scheduled at period end
    if (currentPlan === 'premium' && targetPlan === 'basic') {
      const confirmDowngrade = window.confirm('Downgrade will take effect at your current period end. Continue?')
      if (!confirmDowngrade) return
      setLoading(true)
      try {
        const res = await scheduleDowngradeAction('basic')
        if (!res.success) {
          alert(res.error || 'Failed to schedule downgrade')
        } else {
          const when = res.data?.effectiveAt ? new Date((res.data.effectiveAt as number) * 1000).toLocaleString() : 'the end of your current period'
          alert(`Downgrade scheduled. It will take effect at ${when}. The page will now refresh.`)
          // Force a full page reload to refresh user data
          window.location.reload()
        }
      } catch (err) {
        console.error('Downgrade error:', err)
        alert('An error occurred while scheduling your downgrade.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Handle upgrade: basic -> premium via proration and SCA when needed
    if (currentPlan === 'basic' && targetPlan === 'premium') {
      setLoading(true)
      try {
        const preview = await getUpgradePreviewAction('premium')
        if (!preview.success || !preview.data) {
          setLoading(false)
          alert(preview.error || 'Failed to retrieve upgrade preview')
          return
        }

        // Calculate the immediate charge amount
        // Use amount_due as primary source (most accurate for upgrades)
        const immediate = (preview.data.prorationAmountNow ?? preview.data.amountDue ?? 0) / 100
        const currency = (preview.data.currency || 'usd').toUpperCase()
        
        // Preview data logging removed to prevent sensitive financial data exposure
        
        // Build confirmation message with more context
        let confirmMessage = `You are upgrading from Basic to Premium.\n\n`
        if (immediate > 0) {
          confirmMessage += `Immediate charge: ${immediate.toFixed(2)} ${currency} (prorated for remaining billing period)\n\n`
        } else {
          confirmMessage += `Immediate charge: ${immediate.toFixed(2)} ${currency}\n\n`
          confirmMessage += `Note: The charge shows $0 because you may have just subscribed, or there may be a pricing configuration issue. `
          confirmMessage += `You will be charged the full Premium price at your next billing cycle.\n\n`
        }
        confirmMessage += `Continue with upgrade?`
        
        const proceed = window.confirm(confirmMessage)
        if (!proceed) { setLoading(false); return }

        const result = await upgradeSubscriptionAction('premium')
        if (!result.success) {
          alert(result.error || 'Failed to upgrade subscription')
          setLoading(false)
          return
        }

        const clientSecret = result.data?.clientSecret as string | undefined
        if (clientSecret) {
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)
          if (!stripe) {
            alert('Stripe failed to load. Please try again.')
            setLoading(false)
            return
          }
          // Retrieve PI to decide the correct confirmation path
          const retrieved = await stripe.retrievePaymentIntent(clientSecret)
          const status = retrieved.paymentIntent?.status
          if (status === 'requires_action' || status === 'requires_confirmation') {
            // SCA challenge with existing default payment method
            const confirmation = await stripe.confirmCardPayment(clientSecret)
            if (confirmation.error) {
              console.error('SCA confirmation error:', confirmation.error)
              alert(confirmation.error.message || 'Payment confirmation failed')
              setLoading(false)
              return
            }
          } else if (status === 'requires_payment_method') {
            // No default payment method on file; send user to Billing Portal
            const portal = await createBillingPortalAction()
            if (portal.success && portal.data?.url) {
              alert('Please add or update your payment method to complete the upgrade. A new tab will open to Stripe.')
              window.open(portal.data.url, '_blank', 'noopener,noreferrer')
            } else {
              alert(portal.error || 'No payment method on file. Please update your payment method in your profile.')
            }
            setLoading(false)
            return
          }
        }

        alert('Your plan has been upgraded to Premium. The page will now refresh to show your new access level.')
        // Force a full page reload to refresh user data
        window.location.reload()
      } catch (err) {
        console.error('Upgrade error:', err)
        alert('An error occurred while upgrading your plan.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Fallback: if none of the above matched, route to checkout for safety
    if (productId) {
      setLoading(true)
      try {
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
      className={`relative overflow-hidden transition-all hover:scale-[1.02] flex flex-col h-full border ${variantClasses} ${getCardStyles()}`}
    >
      {/* Gradient overlay for premium effect - uses dynamic colors */}
      {variant === 'premium' && (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-primary/20" />
      )}
      {variant === 'basic' && (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-secondary/20" />
      )}
      
      {/* Premium badge or Current Plan badge - uses dynamic gradient with responsive positioning */}
      {variant === 'premium' && !isCurrentPlan && (
        <div className="absolute top-2 right-2 lg:top-4 lg:right-4 text-white text-xs font-bold px-3 py-1 rounded-full z-10 bg-linear-to-r from-primary to-secondary">
          POPULAR
        </div>
      )}
      {isCurrentPlan && (
        <div 
          className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10"
        >
          CURRENT PLAN
        </div>
      )}
      
      {/* Card header with title and description - extra top padding to avoid badge overlap on smaller screens */}
      <CardHeader className={`relative z-10 ${(variant === 'premium' || isCurrentPlan) ? 'pt-12 lg:pt-6' : ''}`}>
        <CardTitle className="text-2xl flex items-center gap-2">
          {variant === 'premium' && '📱'}
          {variant === 'basic' && '⭐'}
          {variant === 'default' && '🚀'}
          {title}
        </CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      
      {/* Features list - grows to fill available space */}
      <CardContent className="grow relative z-10">
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
          {finalPrice}
        </div>
        {!isFree && (
          <div className="text-sm text-muted-foreground text-center mb-6">/month</div>
        )}
        
        <Button 
          onClick={handlePurchase}
          disabled={loading || isCurrentPlan}
          className={`w-full hover:opacity-90 ${
            !loading && !isCurrentPlan && variant === 'premium'
              ? 'bg-linear-to-r from-primary via-secondary to-primary text-white'
              : !loading && !isCurrentPlan && variant === 'basic'
              ? 'bg-linear-to-r from-secondary to-accent text-white'
              : ''
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            <>
              {isFree ? 'Get Started' : 
               !session ? 'Sign In to Purchase' : 
               'UPGRADE'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

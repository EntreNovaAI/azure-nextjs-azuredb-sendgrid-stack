// Stripe Server Actions
// Next.js Server Actions for Stripe operations
// These wrap the service functions and handle authentication/serialization

'use server'

import { getServerSession } from 'next-auth'
import { createCheckoutSession, getSessionStatus, cancelSubscription, getUpcomingInvoicePreview, upgradeSubscription, scheduleDowngrade, createBillingPortalSession, getActiveSubscription } from './stripe-service'
import { getUserByEmail, updateUserById } from '@lib/kysely/repositories/user-repo'
import { stripe } from './stripe-client'

// Type for action responses
type ActionResponse<T = any> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Create a Stripe checkout session
 * Server Action for initiating payment flow
 * Requires authentication and validates security
 */
export async function createCheckoutAction(productId: string): Promise<ActionResponse> {
  try {
    // Security Check: Verify user is authenticated
    const userSession = await getServerSession()
    if (!userSession?.user?.email) {
      console.log('Unauthorized: No session found')
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // User email logging removed to prevent PII exposure

    // Call the service function
    const result = await createCheckoutSession(productId, userSession.user.email)

    // Return serializable response
    return {
      success: result.success,
      error: result.error,
      data: result.data
    }
  } catch (error) {
    console.error('Create checkout action error:', error)

    return {
      success: false,
      error: 'Failed to create checkout session'
    }
  }
}

/**
 * Get Stripe session status
 * Server Action for retrieving payment session details
 */
export async function getSessionStatusAction(sessionId: string): Promise<ActionResponse> {
  try {
    // Call the service function
    const result = await getSessionStatus(sessionId)

    // Return serializable response
    return {
      success: result.success,
      error: result.error,
      data: result.data
    }
  } catch (error) {
    console.error('Get session status action error:', error)

    return {
      success: false,
      error: 'Failed to retrieve session status'
    }
  }
}

/**
 * Cancel user subscription
 * Server Action for subscription cancellation
 * Requires authentication and validates ownership
 */
export async function cancelSubscriptionAction(stripeCustomerId: string): Promise<ActionResponse> {
  try {
    // Get the session from NextAuth
    const session = await getServerSession()

    // Check if user is authenticated
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Call the service function
    const result = await cancelSubscription(stripeCustomerId, session.user.email)

    // Return serializable response
    return {
      success: result.success,
      error: result.error,
      data: result.data
    }
  } catch (error) {
    console.error('Cancel subscription action error:', error)

    return {
      success: false,
      error: 'Failed to process unsubscribe request'
    }
  }
}

/**
 * Fetch the active price ID for a given Stripe product ID
 * This allows us to store product IDs in env vars and dynamically get the default price
 * When you have multiple price IDs (e.g., after raising prices), this returns the default active price
 */
async function getPriceIdFromProductId(stripeProductId: string): Promise<string | null> {
  try {
    // Product ID logging removed to prevent sensitive identifier exposure
    
    // Query Stripe API for all active prices associated with this product
    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 1 // We only need the first active price (usually the default)
    })
    
    // Return the first active price ID, or null if none found
    if (prices.data.length > 0) {
      const priceId = prices.data[0].id
      // Price ID logging removed to prevent sensitive identifier exposure
      return priceId
    }
    
    // Product ID logging removed to prevent sensitive identifier exposure
    return null
  } catch (error) {
    // Product ID logging removed from error handler to prevent sensitive identifier exposure
    console.error('Error fetching price for product:', error)
    return null
  }
}

/**
 * Map a product key to a Stripe price ID from environment
 * Now fetches the active price from the configured product ID
 */
async function mapProductToPriceId(productId: string): Promise<string | null> {
  // Get the Stripe product ID from environment
  let stripeProductId: string | null = null
  
  if (productId === 'basic') {
    stripeProductId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC || null
  } else if (productId === 'premium') {
    stripeProductId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM || null
  }
  
  if (!stripeProductId) {
    return null
  }
  
  // Fetch the active price ID for this product
  return await getPriceIdFromProductId(stripeProductId)
}

/**
 * Get upgrade proration preview using Upcoming Invoice
 */
export async function getUpgradePreviewAction(newProductId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return { success: false, error: 'Authentication required' }
    }

    const user = await getUserByEmail(session.user.email)
    if (!user?.stripeCustomerId) {
      return { success: false, error: 'No active subscription found for user' }
    }

    const active = await getActiveSubscription(user.stripeCustomerId)
    if (!active.success || !active.data) {
      return { success: false, error: 'No active subscription to preview upgrade' }
    }

    const newPriceId = await mapProductToPriceId(newProductId)
    if (!newPriceId) {
      return { success: false, error: 'Invalid product or configuration' }
    }

    const preview = await getUpcomingInvoicePreview(active.data.id, newPriceId)
    return { success: preview.success, error: preview.error, data: preview.data }
  } catch (error) {
    console.error('getUpgradePreviewAction error:', error)
    return { success: false, error: 'Failed to get upgrade preview' }
  }
}

/**
 * Perform subscription upgrade with SCA handling
 */
export async function upgradeSubscriptionAction(newProductId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return { success: false, error: 'Authentication required' }
    }

    const user = await getUserByEmail(session.user.email)
    if (!user?.stripeCustomerId) {
      return { success: false, error: 'No active subscription found for user' }
    }

    const active = await getActiveSubscription(user.stripeCustomerId)
    if (!active.success || !active.data) {
      return { success: false, error: 'No active subscription to upgrade' }
    }

    const newPriceId = await mapProductToPriceId(newProductId)
    if (!newPriceId) {
      return { success: false, error: 'Invalid product or configuration' }
    }

    const result = await upgradeSubscription(active.data.id, newPriceId)
    
    // If upgrade succeeded, immediately update user's access level in database
    // This provides instant UI feedback while webhook confirms in background
    if (result.success) {
      try {
        const newAccessLevel = newProductId === 'premium' ? 'premium' : 'basic'
        await updateUserById(user.id, { accessLevel: newAccessLevel })
        // Access level logging removed (non-sensitive but keeping logs minimal)
      } catch (dbError) {
        console.error('Failed to update user access level immediately:', dbError)
        // Don't fail the whole operation - webhook will handle it
      }
    }
    
    return { success: result.success, error: result.error, data: result.data }
  } catch (error) {
    console.error('upgradeSubscriptionAction error:', error)
    return { success: false, error: 'Failed to upgrade subscription' }
  }
}

/**
 * Schedule a downgrade at period end via Subscription Schedules
 */
export async function scheduleDowngradeAction(newProductId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return { success: false, error: 'Authentication required' }
    }

    const user = await getUserByEmail(session.user.email)
    if (!user?.stripeCustomerId) {
      return { success: false, error: 'No active subscription found for user' }
    }

    const active = await getActiveSubscription(user.stripeCustomerId)
    if (!active.success || !active.data) {
      return { success: false, error: 'No active subscription to schedule downgrade' }
    }

    const newPriceId = await mapProductToPriceId(newProductId)
    if (!newPriceId) {
      return { success: false, error: 'Invalid product or configuration' }
    }

    const result = await scheduleDowngrade(active.data.id, newPriceId)
    return { success: result.success, error: result.error, data: result.data }
  } catch (error) {
    console.error('scheduleDowngradeAction error:', error)
    return { success: false, error: 'Failed to schedule downgrade' }
  }
}

/**
 * Create billing portal session for payment method updates
 */
export async function createBillingPortalAction(): Promise<ActionResponse> {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return { success: false, error: 'Authentication required' }
    }

    const user = await getUserByEmail(session.user.email)
    if (!user?.stripeCustomerId) {
      return { success: false, error: 'No Stripe customer found for user' }
    }

    const result = await createBillingPortalSession(user.stripeCustomerId)
    return { success: result.success, error: result.error, data: result.data }
  } catch (error) {
    console.error('createBillingPortalAction error:', error)
    return { success: false, error: 'Failed to create billing portal session' }
  }
}

/**
 * Fetch product prices from Stripe API
 * Returns current pricing information for all subscription products
 * This is a public action that doesn't require authentication
 */
export async function fetchStripePricesAction(): Promise<ActionResponse> {
  try {
    // Import stripe client dynamically to use in server action
    const { stripe } = await import('./stripe-client')
    
    // Product ID logging removed to prevent sensitive identifier exposure
    
    // Get product IDs from environment and fetch their active price IDs
    const basicPriceId = await mapProductToPriceId('basic')
    const premiumPriceId = await mapProductToPriceId('premium')
    
    // Price ID logging removed to prevent sensitive identifier exposure
    
    // Initialize result object
    const priceData: {
      basic: { amount: number; currency: string; interval: string } | null
      premium: { amount: number; currency: string; interval: string } | null
    } = {
      basic: null,
      premium: null
    }
    
    // Fetch basic plan price if configured
    if (basicPriceId) {
      try {
        // Price ID logging removed to prevent sensitive identifier exposure
        const basicPrice = await stripe.prices.retrieve(basicPriceId)
        if (basicPrice.unit_amount && basicPrice.currency && basicPrice.recurring?.interval) {
          priceData.basic = {
            amount: basicPrice.unit_amount / 100, // Convert from cents to dollars
            currency: basicPrice.currency.toUpperCase(),
            interval: basicPrice.recurring.interval
          }
          // Price data logging removed to prevent sensitive financial data exposure
        }
      } catch (err) {
        console.error('Failed to fetch basic price from Stripe:', err)
        // Continue to try premium price even if basic fails
      }
    } else {
      console.warn('No basic price ID found - check product configuration in Stripe')
    }
    
    // Fetch premium plan price if configured
    if (premiumPriceId) {
      try {
        // Price ID logging removed to prevent sensitive identifier exposure
        const premiumPrice = await stripe.prices.retrieve(premiumPriceId)
        if (premiumPrice.unit_amount && premiumPrice.currency && premiumPrice.recurring?.interval) {
          priceData.premium = {
            amount: premiumPrice.unit_amount / 100, // Convert from cents to dollars
            currency: premiumPrice.currency.toUpperCase(),
            interval: premiumPrice.recurring.interval
          }
          // Price data logging removed to prevent sensitive financial data exposure
        }
      } catch (err) {
        console.error('Failed to fetch premium price from Stripe:', err)
        // Price will remain null
      }
    } else {
      console.warn('No premium price ID found - check product configuration in Stripe')
    }
    
    return {
      success: true,
      data: priceData
    }
  } catch (error) {
    console.error('fetchStripePricesAction error:', error)
    return {
      success: false,
      error: 'Failed to fetch prices from Stripe'
    }
  }
}


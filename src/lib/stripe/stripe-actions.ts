// Stripe Server Actions
// Next.js Server Actions for Stripe operations
// These wrap the service functions and handle authentication/serialization

'use server'

import { getServerSession } from 'next-auth'
import { createCheckoutSession, getSessionStatus, cancelSubscription } from './stripe-service'

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

    console.log('Creating checkout session for authenticated user:', userSession.user.email)

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


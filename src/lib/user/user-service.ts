// User Service
// Core business logic for user operations
// Handles user fetching, creation, and access level updates

import { getServerSession } from 'next-auth/next'
import { getUserByEmail, createUser, updateUserByEmail } from '@lib/kysely/repositories/user-repo'
import { extractUserUpdateData } from '@lib/stripe/stripe-utils'

// Type for service responses
type ServiceResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get the current authenticated user
 * Fetches user from database or creates if doesn't exist
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<ServiceResponse> {
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

    // Fetch user details from database
    const user = await getUserByEmail(session.user.email)

    // If user not found in database, create them with default access level
    if (!user) {
      const newUser = await createUser({
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
        accessLevel: 'free'
      } as any)

      return {
        success: true,
        data: newUser
      }
    }

    // Return existing user data
    return {
      success: true,
      data: user
    }
  } catch (error) {
    console.error('Error fetching user details:', error)

    return {
      success: false,
      error: 'Failed to fetch user details'
    }
  }
}

/**
 * Update user access level
 * Typically called after successful payment
 * Can process raw Stripe session data or direct access level updates
 */
export async function updateUserAccessLevel(updateData: any): Promise<ServiceResponse> {
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

    let accessLevel: string
    let stripeCustomerId: string | null = null

    // Check if we're receiving raw Stripe session data or processed data
    if (updateData.stripeSessionData) {
      // Process Stripe session data server-side
      const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
      const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

      const extractedData = extractUserUpdateData(
        updateData.stripeSessionData,
        basicPriceId,
        premiumPriceId
      )

      accessLevel = extractedData.accessLevel
      stripeCustomerId = extractedData.stripeCustomerId
    } else {
      // Legacy format - direct accessLevel and stripeCustomerId
      accessLevel = updateData.accessLevel
      stripeCustomerId = updateData.stripeCustomerId
    }

    // Validate access level
    if (!['free', 'basic', 'premium'].includes(accessLevel)) {
      return {
        success: false,
        error: 'Invalid access level'
      }
    }

    // Prepare update data - only include stripeCustomerId if provided
    const updateDataForDb: any = {
      accessLevel: accessLevel,
      updatedAt: new Date()
    }

    // Add Stripe customer ID if provided (for paid subscriptions)
    if (stripeCustomerId) {
      updateDataForDb.stripeCustomerId = stripeCustomerId
    }

    // Update user's access level and Stripe customer ID
    const updatedUser = await updateUserByEmail(session.user.email, updateDataForDb)

    return {
      success: true,
      data: updatedUser
    }
  } catch (error) {
    console.error('Error updating user access level:', error)

    return {
      success: false,
      error: 'Failed to update user access level'
    }
  }
}


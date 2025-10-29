// User Server Actions
// Next.js Server Actions for user operations
// These wrap the service functions and handle serialization for client components

'use server'

import { getCurrentUser, updateUserAccessLevel } from './user-service'

// Type for action responses
type ActionResponse<T = any> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Get current authenticated user
 * Server Action that can be called from client components
 * Returns user data or error
 */
export async function getUserAction(): Promise<ActionResponse> {
  try {
    // Call the service function
    const result = await getCurrentUser()

    // Return serializable response
    return {
      success: result.success,
      error: result.error,
      data: result.data
    }
  } catch (error) {
    console.error('Get user action error:', error)

    return {
      success: false,
      error: 'An unexpected error occurred while fetching user data'
    }
  }
}

/**
 * Update user access level
 * Server Action for updating user subscription/access level
 * Typically called after successful payment
 */
export async function updateUserAction(updateData: any): Promise<ActionResponse> {
  try {
    // Call the service function
    const result = await updateUserAccessLevel(updateData)

    // Return serializable response
    return {
      success: result.success,
      error: result.error,
      data: result.data
    }
  } catch (error) {
    console.error('Update user action error:', error)

    return {
      success: false,
      error: 'An unexpected error occurred while updating user'
    }
  }
}


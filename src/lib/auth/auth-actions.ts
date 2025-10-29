// Auth Server Actions
// Next.js Server Actions for authentication operations
// These wrap the service functions and handle serialization for client components

'use server'

import { registerUser, requestPasswordReset, resetPassword } from './auth-service'

// Type for action responses
// Ensures all data is serializable for client components
type ActionResponse<T = any> = {
  success: boolean
  message?: string
  error?: string
  data?: T
  details?: any
}

/**
 * Register a new user
 * Server Action that can be called directly from client components
 * Returns serializable data compatible with client-side React
 */
export async function registerUserAction(
  email: string,
  password: string,
  name?: string
): Promise<ActionResponse> {
  try {
    // Call the service function
    const result = await registerUser(email, password, name)

    // Return serializable response
    if (result.success) {
      return {
        success: true,
        message: 'User created successfully',
        data: result.data
      }
    } else {
      return {
        success: false,
        error: result.error,
        details: result.details
      }
    }
  } catch (error) {
    console.error('Register user action error:', error)
    
    // Return a safe error message (no Error objects)
    return {
      success: false,
      error: 'An unexpected error occurred during registration'
    }
  }
}

/**
 * Request a password reset email
 * Server Action for initiating password reset flow
 */
export async function requestPasswordResetAction(
  email: string
): Promise<ActionResponse> {
  try {
    // Call the service function
    const result = await requestPasswordReset(email)

    // Return serializable response
    if (result.success) {
      return {
        success: true,
        message: result.data?.message || 'If an account with this email exists, a password reset email has been sent.'
      }
    } else {
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    console.error('Request password reset action error:', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred while requesting password reset'
    }
  }
}

/**
 * Reset password using a valid token
 * Server Action for completing password reset flow
 */
export async function resetPasswordAction(
  token: string,
  password: string
): Promise<ActionResponse> {
  try {
    // Call the service function
    const result = await resetPassword(token, password)

    // Return serializable response
    if (result.success) {
      return {
        success: true,
        message: result.data?.message || 'Password has been successfully reset'
      }
    } else {
      return {
        success: false,
        error: result.error,
        details: result.details
      }
    }
  } catch (error) {
    console.error('Reset password action error:', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred during password reset'
    }
  }
}


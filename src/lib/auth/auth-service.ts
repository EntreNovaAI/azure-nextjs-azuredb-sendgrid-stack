// Auth Service
// Core business logic for user authentication operations
// Used by Server Actions and can be called directly from server components

import { createUserWithPassword, getUserByEmail, userHasPassword, createPasswordResetToken, getValidPasswordResetToken, markPasswordResetTokenAsUsed, updateUserPassword } from '@lib/kysely/repositories/user-repo'
import { validatePasswordStrength } from '@lib/auth/password-utils'
import { EmailService } from '@lib/mailersend/email-service'
import { createId } from '@paralleldrive/cuid2'

// Type for service responses
// Returns a consistent structure for all auth operations
type ServiceResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  details?: any
}

/**
 * Register a new user with email and password
 * Validates email format, password strength, and checks for existing users
 * Returns the created user data without sensitive information
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<ServiceResponse> {
  try {
    // Validate required fields
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      }
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format'
      }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      }
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      }
    }

    // Create new user with hashed password
    const newUser = await createUserWithPassword(email, password, name)

    // Return success with user data (excluding password)
    return {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        accessLevel: newUser.accessLevel,
        createdAt: newUser.createdAt
      }
    }
  } catch (error) {
    console.error('Registration error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return {
          success: false,
          error: 'User with this email already exists'
        }
      }
    }

    return {
      success: false,
      error: 'Internal server error during registration'
    }
  }
}

/**
 * Request a password reset for a user
 * Generates a secure token and sends reset email
 * Does not reveal if the email exists for security reasons
 */
export async function requestPasswordReset(email: string): Promise<ServiceResponse> {
  try {
    // Validate required field
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format'
      }
    }

    // Check if user exists and has a password
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        data: {
          message: 'If an account with this email exists, a password reset email has been sent.'
        }
      }
    }

    // Check if user has a password set (skip OAuth-only users)
    const hasPassword = await userHasPassword(email)
    if (!hasPassword) {
      return {
        success: false,
        error: 'This account does not have a password set. Please use OAuth login instead.'
      }
    }

    // Generate a URL-safe reset token
    // IMPORTANT: Do NOT use password-like generators with special characters here.
    // Symbols like '?' or '#' can break path-based links and truncate tokens in URLs.
    // We use cuid2 which yields a collision-resistant, URL-safe token.
    const resetToken = createId()

    // Create password reset token in database (expires in 24 hours)
    await createPasswordResetToken(user.id, resetToken, 24)

    // Send password reset email
    const emailService = new EmailService()
    try {
      await emailService.sendPasswordResetEmail(
        { email, name: user.name || 'User' },
        {
          userName: user.name || 'User',
          // Encode the token to be extra safe in URLs
          resetUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password/${encodeURIComponent(resetToken)}`,
          expirationTime: '24 hours'
        }
      )

      console.log(`Password reset email sent to ${email}`)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again later.'
      }
    }

    // Return success response (don't reveal if email exists)
    return {
      success: true,
      data: {
        message: 'If an account with this email exists, a password reset email has been sent.'
      }
    }
  } catch (error) {
    console.error('Forgot password error:', error)

    return {
      success: false,
      error: 'Internal server error during password reset request'
    }
  }
}

/**
 * Reset user password using a valid token
 * Validates the token, updates the password, and marks token as used
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<ServiceResponse> {
  try {
    // Validate required fields
    if (!token || !password) {
      return {
        success: false,
        error: 'Token and password are required'
      }
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      }
    }

    // Validate token exists and is not expired/used
    const resetToken = await getValidPasswordResetToken(token)
    if (!resetToken) {
      return {
        success: false,
        error: 'Invalid or expired reset token'
      }
    }

    // Update user's password
    try {
      await updateUserPassword(resetToken.userId, password)
    } catch (error) {
      console.error('Error updating user password:', error)
      return {
        success: false,
        error: 'Failed to update password. Please try again.'
      }
    }

    // Mark token as used
    const markedAsUsed = await markPasswordResetTokenAsUsed(token)
    if (!markedAsUsed) {
      console.warn(`Failed to mark token as used for user ${resetToken.userId}`)
      // Don't fail the request for this, as password was already updated
    }

    console.log(`Password successfully reset for user ${resetToken.userId}`)

    // Return success response
    return {
      success: true,
      data: {
        message: 'Password has been successfully reset. You can now sign in with your new password.'
      }
    }
  } catch (error) {
    console.error('Password reset error:', error)

    return {
      success: false,
      error: 'Internal server error during password reset'
    }
  }
}


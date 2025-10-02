// Password reset API endpoint
// Handles password reset using a valid token

import { NextRequest, NextResponse } from 'next/server'
import { getValidPasswordResetToken, markPasswordResetTokenAsUsed, updateUserPassword } from '@/app/_lib/kysely/repositories/user-repo'
import { validatePasswordStrength } from '@/app/_lib/auth/password-utils'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { token, password } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Validate token exists and is not expired/used
    const resetToken = await getValidPasswordResetToken(token)
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update user's password
    try {
      await updateUserPassword(resetToken.userId, password)
    } catch (error) {
      console.error('Error updating user password:', error)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // Mark token as used
    const markedAsUsed = await markPasswordResetTokenAsUsed(token)
    if (!markedAsUsed) {
      console.warn(`Failed to mark token as used for user ${resetToken.userId}`)
      // Don't fail the request for this, as password was already updated
    }

    console.log(`Password successfully reset for user ${resetToken.userId}`)

    // Return success response
    return NextResponse.json(
      { message: 'Password has been successfully reset. You can now sign in with your new password.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset error:', error)

    return NextResponse.json(
      { error: 'Internal server error during password reset' },
      { status: 500 }
    )
  }
}

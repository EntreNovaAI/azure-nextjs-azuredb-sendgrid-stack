// Forgot password API endpoint
// Handles password reset requests by sending reset emails to users

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, userHasPassword, createPasswordResetToken } from '@/app/_lib/kysely/repositories/user-repo'
import { EmailService } from '@/app/_lib/mailersend/email-service'
import { createId } from '@paralleldrive/cuid2'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user exists and has a password
    const user = await getUserByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account with this email exists, a password reset email has been sent.' },
        { status: 200 }
      )
    }

    // Check if user has a password set (skip OAuth-only users)
    const hasPassword = await userHasPassword(email)
    if (!hasPassword) {
      return NextResponse.json(
        { error: 'This account does not have a password set. Please use OAuth login instead.' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      )
    }

    // Return success response (don't reveal if email exists)
    return NextResponse.json(
      { message: 'If an account with this email exists, a password reset email has been sent.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)

    return NextResponse.json(
      { error: 'Internal server error during password reset request' },
      { status: 500 }
    )
  }
}

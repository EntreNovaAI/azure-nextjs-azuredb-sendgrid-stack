// Mobile Login API Endpoint
// Authenticates user with email/password and returns JWT tokens
// Stores refresh token in database for revocation support

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmailWithPassword } from '@lib/kysely/repositories/user-repo'
import { createSession } from '@lib/kysely/repositories/session-repo'
import { verifyPassword } from '@lib/auth/password-utils'
import { createAccessToken, createRefreshToken } from '@lib/auth/jwt-utils'
import { loginSchema, getFirstZodError } from '@lib/auth/validation-schemas'

// Force dynamic rendering (secrets accessed at runtime)
export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/auth/login
 * Authenticate user with email and password
 * 
 * Request body:
 * - email: string
 * - password: string
 * 
 * Response:
 * - Success: { token, refreshToken, user }
 * - Error: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input with Zod schema
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getFirstZodError(validation.error) },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()

    // Get user with password hash from database
    const user = await getUserByEmailWithPassword(normalizedEmail)

    if (!user) {
      // Generic error to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user has a password set (might be OAuth-only user)
    // Return generic error to prevent user enumeration attacks
    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create JWT tokens
    const accessToken = await createAccessToken(
      user.id,
      user.email || '',
      user.accessLevel || 'free'
    )

    // Create refresh token with jti for database storage
    const { token: refreshToken, expiresAt } = await createRefreshToken(user.id)

    // Store refresh token in database for revocation support
    await createSession(user.id, refreshToken, expiresAt)

    // Return tokens and user data (without password)
    return NextResponse.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        accessLevel: user.accessLevel || 'free',
        memberSince: user.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

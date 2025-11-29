// Mobile Registration API Endpoint
// Creates new user account with email/password and returns JWT tokens
// Stores refresh token in database for revocation support

import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUserWithPassword } from '@lib/kysely/repositories/user-repo'
import { createSession } from '@lib/kysely/repositories/session-repo'
import { validatePasswordStrength } from '@lib/auth/password-utils'
import { createAccessToken, createRefreshToken } from '@lib/auth/jwt-utils'
import { registerSchema, getFirstZodError } from '@lib/auth/validation-schemas'

// Force dynamic rendering (secrets accessed at runtime)
export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/auth/register
 * Create a new user account with email and password
 * 
 * Request body:
 * - email: string
 * - password: string
 * - name: string (optional)
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
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getFirstZodError(validation.error) },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim()

    // Validate password strength (additional checks beyond Zod)
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user with hashed password
    const newUser = await createUserWithPassword(
      normalizedEmail,
      password,
      name?.trim() || undefined
    )

    // Create JWT tokens
    const accessToken = await createAccessToken(
      newUser.id,
      newUser.email || '',
      newUser.accessLevel || 'free'
    )

    // Create refresh token with jti for database storage
    const { token: refreshToken, expiresAt } = await createRefreshToken(newUser.id)

    // Store refresh token in database for revocation support
    await createSession(newUser.id, refreshToken, expiresAt)

    // Return tokens and user data
    return NextResponse.json({
      token: accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        image: newUser.image,
        accessLevel: newUser.accessLevel || 'free',
        memberSince: newUser.createdAt?.toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Mobile registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

// Mobile Token Refresh API Endpoint
// Exchanges refresh token for new access token with token rotation
// Validates refresh token exists in database before issuing new tokens

import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@lib/kysely/repositories/user-repo'
import { getSessionByToken, deleteSessionByToken, createSession } from '@lib/kysely/repositories/session-repo'
import { verifyRefreshToken, createAccessToken, createRefreshToken } from '@lib/auth/jwt-utils'
import { refreshSchema, getFirstZodError } from '@lib/auth/validation-schemas'

// Force dynamic rendering (secrets accessed at runtime)
export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/auth/refresh
 * Exchange refresh token for new access and refresh tokens
 * Implements token rotation: old refresh token is invalidated
 * 
 * Request body:
 * - refreshToken: string
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
    const validation = refreshSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getFirstZodError(validation.error) },
        { status: 400 }
      )
    }

    const { refreshToken } = validation.data

    // Verify the refresh token JWT signature and claims
    const payload = await verifyRefreshToken(refreshToken)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Verify the refresh token exists in database (not revoked)
    const session = await getSessionByToken(refreshToken)

    if (!session) {
      // Token was revoked or doesn't exist in database
      // This could indicate token theft - attacker trying to use old token
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      )
    }

    // Verify the session belongs to the same user
    if (session.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const user = await getUserById(payload.userId)

    if (!user) {
      // User was deleted - revoke the session
      await deleteSessionByToken(refreshToken)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Token rotation: Delete the old session (invalidate old refresh token)
    await deleteSessionByToken(refreshToken)

    // Create new tokens
    const newAccessToken = await createAccessToken(
      user.id,
      user.email || '',
      user.accessLevel || 'free'
    )

    // Create new refresh token with new jti
    const { token: newRefreshToken, expiresAt } = await createRefreshToken(user.id)

    // Store new refresh token in database
    await createSession(user.id, newRefreshToken, expiresAt)

    // Return new tokens and user data
    return NextResponse.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
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
    console.error('Mobile token refresh error:', error)
    return NextResponse.json(
      { error: 'An error occurred during token refresh' },
      { status: 500 }
    )
  }
}

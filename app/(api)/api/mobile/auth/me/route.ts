// Mobile User Profile API Endpoint
// Returns current authenticated user's profile
// Used by Flutter app to verify session and get user data

import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@lib/kysely/repositories/user-repo'
import { verifyToken, extractBearerToken } from '@lib/auth/jwt-utils'

// Force dynamic rendering (secrets accessed at runtime)
export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/auth/me
 * Get current authenticated user's profile
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * - Success: { user }
 * - Error: { error: string }
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const token = extractBearerToken(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Verify and decode token
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check token type
    if (payload.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const user = await getUserById(payload.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user profile (without sensitive data)
    return NextResponse.json({
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
    console.error('Mobile get user error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}


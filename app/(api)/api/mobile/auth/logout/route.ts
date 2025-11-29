// Mobile Logout API Endpoint
// Revokes refresh token by deleting it from the database
// Prevents the refresh token from being used again

import { NextRequest, NextResponse } from 'next/server'
import { deleteSessionByToken } from '@lib/kysely/repositories/session-repo'
import { logoutSchema, getFirstZodError } from '@lib/auth/validation-schemas'

// Force dynamic rendering (secrets accessed at runtime)
export const dynamic = 'force-dynamic'

/**
 * POST /api/mobile/auth/logout
 * Revoke a refresh token (logout)
 * 
 * Request body:
 * - refreshToken: string
 * 
 * Response:
 * - Success: { success: true }
 * - Error: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input with Zod schema
    const validation = logoutSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getFirstZodError(validation.error) },
        { status: 400 }
      )
    }

    const { refreshToken } = validation.data

    // Delete the session from database (revoke token)
    // We don't verify the JWT here - if someone has the token and wants to revoke it, let them
    // This also handles cases where the token might be expired but still in the database
    await deleteSessionByToken(refreshToken)

    // Always return success even if token wasn't found
    // This prevents information disclosure about valid tokens
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mobile logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}


// Mobile Google OAuth API Endpoint
// Handles authorization code flow from mobile apps (google_sign_in v7.x)
// Exchanges auth code for tokens, verifies, and creates/authenticates user
//
// Flow:
// 1. Receive serverAuthCode from mobile app
// 2. Exchange code with Google for ID token
// 3. Verify ID token and extract user info
// 4. Create/update user in database
// 5. Return our JWT tokens

import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { getUserByEmail, createUser, updateUserById } from '@lib/kysely/repositories/user-repo'
import { createSession } from '@lib/kysely/repositories/session-repo'
import { createAccessToken, createRefreshToken } from '@lib/auth/jwt-utils'
import { z } from 'zod'

// Force dynamic rendering (secrets accessed at runtime)
export const dynamic = 'force-dynamic'

// Initialize Google OAuth client for token exchange and verification
// Note: For mobile auth code exchange, we don't need a redirect URI
// but we do need the client secret for the token exchange
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

// Validation schema for google_sign_in v7.x authorization code flow
const googleAuthSchema = z.object({
  serverAuthCode: z.string().min(1, 'serverAuthCode is required'),
  email: z.email().optional(),
  name: z.string().optional(),
  picture: z.string().optional()
})

/**
 * POST /api/mobile/auth/google
 * Authenticate user with Google OAuth from mobile app
 * Uses authorization code flow (google_sign_in v7.x)
 * 
 * Request body:
 * - serverAuthCode: string (required - from authorizeServer())
 * - email, name, picture: optional hints
 * 
 * Response:
 * - Success: { token, refreshToken, user }
 * - Error: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = googleAuthSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const { serverAuthCode, email, name, picture } = validation.data

    console.log('[Google Auth] Received auth code for:', email)

    // Exchange the authorization code for tokens
    console.log('[Google Auth] Exchanging auth code for tokens...')
    const { tokens } = await googleClient.getToken(serverAuthCode)
    
    if (!tokens.id_token) {
      console.error('[Google Auth] No ID token received from code exchange')
      return NextResponse.json(
        { error: 'Failed to get ID token from Google' },
        { status: 401 }
      )
    }
    console.log('[Google Auth] Token exchange successful')

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    if (!payload || !payload.email || !payload.email_verified) {
      console.error('[Google Auth] ID token invalid or email not verified')
      return NextResponse.json(
        { error: 'Google email not verified' },
        { status: 401 }
      )
    }

    const googleEmail = payload.email
    const googleName = payload.name || name
    const googlePicture = payload.picture || picture
    console.log('[Google Auth] Verified email:', googleEmail)

    // If email was provided in request, verify it matches
    if (email && email.toLowerCase() !== googleEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email mismatch with Google token' },
        { status: 401 }
      )
    }

    // Normalize email
    const normalizedEmail = googleEmail.toLowerCase().trim()

    // Check if user already exists
    let user = await getUserByEmail(normalizedEmail)

    if (user) {
      // Update user's profile if needed (name/image might have changed)
      const updates: Record<string, string> = {}
      if (googleName && googleName !== user.name) {
        updates.name = googleName
      }
      if (googlePicture && googlePicture !== user.image) {
        updates.image = googlePicture
      }
      
      if (Object.keys(updates).length > 0) {
        user = await updateUserById(user.id, updates)
      }
    } else {
      // Create new user account
      user = await createUser({
        email: normalizedEmail,
        name: googleName || null,
        image: googlePicture || null,
        accessLevel: 'free'
      })
    }

    // Create JWT tokens
    const jwtAccessToken = await createAccessToken(
      user.id,
      user.email || '',
      user.accessLevel || 'free'
    )

    // Create refresh token with jti for database storage
    const { token: refreshToken, expiresAt } = await createRefreshToken(user.id)

    // Store refresh token in database for revocation support
    await createSession(user.id, refreshToken, expiresAt)

    // Return tokens and user data
    return NextResponse.json({
      token: jwtAccessToken,
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
    console.error('Mobile Google auth error:', error)
    return NextResponse.json(
      { error: 'An error occurred during Google authentication' },
      { status: 500 }
    )
  }
}

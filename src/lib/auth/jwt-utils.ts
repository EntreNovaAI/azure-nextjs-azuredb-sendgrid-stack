// JWT utilities for mobile authentication
// Creates and verifies JWT tokens for Flutter app authentication
// Uses jose library for Edge Runtime compatibility

import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { createId } from '@paralleldrive/cuid2'

// JWT configuration constants
const JWT_ISSUER = process.env.JWT_ISSUER || ''
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || ''

// Token expiration times
// Access tokens: Short-lived for security (24 hours for mobile convenience)
// Refresh tokens: Longer-lived, stored in database for revocation
const ACCESS_TOKEN_EXPIRY = '24h'
const REFRESH_TOKEN_EXPIRY = '30d'

// JWT secret - must be at least 32 characters
// Uses NEXTAUTH_SECRET for consistency with existing auth
const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be set and at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

// JWT payload structure for access tokens
export interface AccessTokenPayload extends JWTPayload {
  userId: string
  email: string
  accessLevel: string
  type: 'access'
}

// JWT payload structure for refresh tokens
// Includes jti (JWT ID) for database lookup and revocation
export interface RefreshTokenPayload extends JWTPayload {
  userId: string
  type: 'refresh'
  jti: string // Unique token ID for database storage
}

// Union type for all mobile tokens
export type MobileTokenPayload = AccessTokenPayload | RefreshTokenPayload

/**
 * Create a JWT access token for mobile authentication
 * Access tokens are short-lived and contain user info
 * @param userId - User's database ID
 * @param email - User's email address
 * @param accessLevel - User's subscription level
 * @returns Promise<string> - Signed JWT token
 */
export async function createAccessToken(
  userId: string,
  email: string,
  accessLevel: string
): Promise<string> {
  const secret = getJwtSecret()

  const token = await new SignJWT({
    userId,
    email,
    accessLevel,
    type: 'access'
  } as AccessTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .sign(secret)

  return token
}

/**
 * Create a refresh token for mobile authentication
 * Refresh tokens include a jti (JWT ID) for database storage and revocation
 * @param userId - User's database ID
 * @returns Promise<{ token: string, jti: string, expiresAt: Date }> - Token with metadata
 */
export async function createRefreshToken(userId: string): Promise<{
  token: string
  jti: string
  expiresAt: Date
}> {
  const secret = getJwtSecret()
  const jti = createId() // Unique ID for this refresh token

  // Calculate expiration date (30 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const token = await new SignJWT({
    userId,
    type: 'refresh',
    jti
  } as RefreshTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setJti(jti)
    .sign(secret)

  return { token, jti, expiresAt }
}

/**
 * Verify and decode a JWT token
 * Validates signature, expiration, issuer, and audience
 * @param token - JWT token string
 * @returns Promise<MobileTokenPayload | null> - Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    })
    return payload as MobileTokenPayload
  } catch (error) {
    // Token is invalid, expired, or has wrong issuer/audience
    return null
  }
}

/**
 * Verify specifically an access token
 * @param token - JWT token string
 * @returns Promise<AccessTokenPayload | null> - Decoded payload or null
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  const payload = await verifyToken(token)
  if (payload && payload.type === 'access') {
    return payload as AccessTokenPayload
  }
  return null
}

/**
 * Verify specifically a refresh token
 * @param token - JWT token string
 * @returns Promise<RefreshTokenPayload | null> - Decoded payload or null
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  const payload = await verifyToken(token)
  if (payload && payload.type === 'refresh') {
    return payload as RefreshTokenPayload
  }
  return null
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns string | null - Token or null if not found
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7) // Remove "Bearer " prefix
}

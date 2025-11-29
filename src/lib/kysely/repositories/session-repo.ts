// Session Repository
// Manages refresh token storage in the Session table
// Enables token revocation and session management for mobile auth

import { db } from '@lib/kysely'
import type { Session, NewSession } from '@lib/kysely/types'
import { createId } from '@paralleldrive/cuid2'

/**
 * Create a new session (store refresh token)
 * @param userId - User's database ID
 * @param sessionToken - The refresh token to store
 * @param expiresAt - When the token expires
 * @returns The created session
 */
export async function createSession(
  userId: string,
  sessionToken: string,
  expiresAt: Date
): Promise<Session> {
  const id = createId()

  await db
    .insertInto('Session')
    .values({
      id,
      userId,
      sessionToken,
      expires: expiresAt,
    })
    .execute()

  // SQL Server doesn't support RETURNING, so select after insert
  const session = await db
    .selectFrom('Session')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!session) {
    throw new Error('Failed to create session')
  }

  return session
}

/**
 * Get a session by its token
 * Used to validate refresh tokens
 * @param sessionToken - The refresh token to look up
 * @returns The session if found and not expired, null otherwise
 */
export async function getSessionByToken(sessionToken: string): Promise<Session | null> {
  const now = new Date()

  const session = await db
    .selectFrom('Session')
    .selectAll()
    .where('sessionToken', '=', sessionToken)
    .where('expires', '>', now)
    .executeTakeFirst()

  return session ?? null
}

/**
 * Delete a session by its token (logout / revoke single token)
 * @param sessionToken - The refresh token to revoke
 * @returns True if a session was deleted, false otherwise
 */
export async function deleteSessionByToken(sessionToken: string): Promise<boolean> {
  const result = await db
    .deleteFrom('Session')
    .where('sessionToken', '=', sessionToken)
    .execute()

  // Check if any rows were affected
  return result.length > 0 && (result[0].numDeletedRows ?? 0) > 0
}

/**
 * Delete all sessions for a user (revoke all tokens)
 * Useful for security events like password change or account compromise
 * @param userId - User's database ID
 * @returns Number of sessions deleted
 */
export async function deleteSessionsByUserId(userId: string): Promise<number> {
  const result = await db
    .deleteFrom('Session')
    .where('userId', '=', userId)
    .execute()

  return Number(result[0]?.numDeletedRows ?? 0)
}

/**
 * Clean up expired sessions
 * Should be run periodically (e.g., daily cron job)
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date()

  const result = await db
    .deleteFrom('Session')
    .where('expires', '<=', now)
    .execute()

  return Number(result[0]?.numDeletedRows ?? 0)
}

/**
 * Get all active sessions for a user
 * Useful for showing user their active sessions
 * @param userId - User's database ID
 * @returns Array of active sessions
 */
export async function getSessionsByUserId(userId: string): Promise<Session[]> {
  const now = new Date()

  const sessions = await db
    .selectFrom('Session')
    .selectAll()
    .where('userId', '=', userId)
    .where('expires', '>', now)
    .execute()

  return sessions
}


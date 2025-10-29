import { db } from '@lib/kysely'
import type { NewUser, User, UserUpdate, NewPasswordResetToken, PasswordResetToken } from '@lib/kysely/types'
import { createId } from '@paralleldrive/cuid2'
import { hashPassword } from '@lib/auth/password-utils'

// Common projection used across routes
const userSelect = [
  'id',
  'name',
  'email',
  'accessLevel',
  'stripeCustomerId',
  'createdAt',
  'updatedAt',
  'image',
] as const

export async function getUserByEmail(email: string): Promise<Pick<User, typeof userSelect[number]> | null> {
  const row = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('email', '=', email)
    .executeTakeFirst()

  return row as any ?? null
}

export async function getUserById(id: string): Promise<User | null> {
  return await db.selectFrom('User').selectAll().where('id', '=', id).executeTakeFirst() ?? null
}

export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  return await db
    .selectFrom('User')
    .selectAll()
    .where('stripeCustomerId', '=', customerId)
    .executeTakeFirst() ?? null
}

export async function createUser(data: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pick<User, typeof userSelect[number]>> {
  const now = new Date()
  const id = createId() // Generate cuid like Prisma does
  
  // SQL Server doesn't support RETURNING, so we insert then select
  await db
    .insertInto('User')
    .values({
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as any)
    .execute()

  // Select the created user by id
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user) {
    throw new Error('Failed to create user')
  }

  return user as any
}

export async function updateUserById(id: string, data: Partial<UserUpdate>): Promise<Pick<User, typeof userSelect[number]>> {
  // SQL Server doesn't support RETURNING, so we update then select
  await db
    .updateTable('User')
    .set({ ...data, updatedAt: new Date() } as any)
    .where('id', '=', id)
    .execute()

  // Select the updated user
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user) {
    throw new Error('User not found after update')
  }

  return user as any
}

export async function updateUserByEmail(email: string, data: Partial<UserUpdate>): Promise<Pick<User, typeof userSelect[number]>> {
  // SQL Server doesn't support RETURNING, so we update then select
  await db
    .updateTable('User')
    .set({ ...data, updatedAt: new Date() } as any)
    .where('email', '=', email)
    .execute()

  // Select the updated user
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('email', '=', email)
    .executeTakeFirst()

  if (!user) {
    throw new Error('User not found after update')
  }

  return user as any
}

export async function linkStripeIdToUserId(userId: string, stripeCustomerId: string): Promise<void> {
  await db
    .updateTable('User')
    .set({ stripeCustomerId, updatedAt: new Date() })
    .where('id', '=', userId)
    .execute()
}

export async function getUserByEmailAndStripeId(email: string, stripeCustomerId: string): Promise<User | null> {
  return await db
    .selectFrom('User')
    .selectAll()
    .where('email', '=', email)
    .where('stripeCustomerId', '=', stripeCustomerId)
    .executeTakeFirst() ?? null
}

export async function setAccessLevelById(userId: string, accessLevel: string): Promise<void> {
  await db
    .updateTable('User')
    .set({ accessLevel, updatedAt: new Date() })
    .where('id', '=', userId)
    .execute()
}

/**
 * Create a user with email and password for vanilla login
 * @param email - User's email address
 * @param password - Plain text password (will be hashed)
 * @param name - Optional user name
 * @returns Promise<User> - The created user (without password field)
 */
export async function createUserWithPassword(
  email: string, 
  password: string, 
  name?: string
): Promise<Pick<User, typeof userSelect[number]>> {
  // Hash the password before storing
  const hashedPassword = await hashPassword(password)
  
  const now = new Date()
  const id = createId()
  
  // Insert user with hashed password
  await db
    .insertInto('User')
    .values({
      id,
      email,
      name: name || null,
      password: hashedPassword,
      accessLevel: 'free',
      createdAt: now,
      updatedAt: now,
    } as any)
    .execute()

  // Return user without password field for security
  const user = await db
    .selectFrom('User')
    .select(userSelect as unknown as any)
    .where('id', '=', id)
    .executeTakeFirst()

  if (!user) {
    throw new Error('Failed to create user')
  }

  return user as any
}

/**
 * Get user by email including password hash for authentication
 * WARNING: Only use this for authentication - never return password to client
 * @param email - User's email address
 * @returns Promise<User | null> - User with password hash or null
 */
export async function getUserByEmailWithPassword(email: string): Promise<(User & { password: string | null }) | null> {
  const row = await db
    .selectFrom('User')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst()

  return row as any ?? null
}

/**
 * Update user's password
 * @param userId - User's ID
 * @param newPassword - New plain text password (will be hashed)
 * @returns Promise<void>
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword)
  
  await db
    .updateTable('User')
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where('id', '=', userId)
    .execute()
}

/**
 * Check if user has a password set (for vanilla login)
 * @param email - User's email address
 * @returns Promise<boolean> - True if user has password, false otherwise
 */
export async function userHasPassword(email: string): Promise<boolean> {
  const user = await db
    .selectFrom('User')
    .select(['password'])
    .where('email', '=', email)
    .executeTakeFirst()

  return !!(user?.password)
}

/**
 * Create a password reset token for a user
 * @param userId - User's ID
 * @param token - Reset token string
 * @param expiresInHours - Token expiration time in hours (default: 24)
 * @returns Promise<string> - The created token ID
 */
export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresInHours: number = 24
): Promise<string> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (expiresInHours * 60 * 60 * 1000))

  // Invalidate any existing unused tokens for this user
  await db
    .updateTable('PasswordResetToken')
    .set({ used: true })
    .where('userId', '=', userId)
    .where('used', '=', false)
    .execute()

  // Create new token
  const id = createId()
  await db
    .insertInto('PasswordResetToken')
    .values({
      id,
      userId,
      token,
      expires: expiresAt,
      used: false,
      createdAt: now,
    } as any)
    .execute()

  return id
}

/**
 * Get a valid password reset token by token string
 * @param token - The reset token string
 * @returns Promise<PasswordResetToken | null> - The token if found and valid
 */
export async function getValidPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const now = new Date()

  const resetToken = await db
    .selectFrom('PasswordResetToken')
    .selectAll()
    .where('token', '=', token)
    .where('used', '=', false)
    .where('expires', '>', now)
    .executeTakeFirst()

  return resetToken as any ?? null
}

/**
 * Mark a password reset token as used
 * @param token - The reset token string
 * @returns Promise<boolean> - True if token was found and marked as used
 */
export async function markPasswordResetTokenAsUsed(token: string): Promise<boolean> {
  const result = await db
    .updateTable('PasswordResetToken')
    .set({ used: true })
    .where('token', '=', token)
    .where('used', '=', false)
    .execute()

  // Check if any rows were affected
  return result.length > 0
}

/**
 * Clean up expired password reset tokens (should be run periodically)
 * @returns Promise<number> - Number of tokens deleted
 */
export async function cleanupExpiredPasswordResetTokens(): Promise<number> {
  const now = new Date()

  const result = await db
    .deleteFrom('PasswordResetToken')
    .where('expires', '<=', now)
    .execute()

  return result.length
}



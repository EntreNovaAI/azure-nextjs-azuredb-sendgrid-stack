// Validation schemas for mobile auth endpoints
// Uses Zod for type-safe request validation
// All schemas return user-friendly error messages

import { z } from 'zod'

/**
 * Login request validation schema
 * Validates email format and requires password
 */
export const loginSchema = z.object({
  email: z.email({ error: 'Invalid email format' }),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required')
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Registration request validation schema
 * Validates email, enforces password requirements, optional name
 */
export const registerSchema = z.object({
  email: z.email({ error: 'Invalid email format' }),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  name: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .optional()
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Google OAuth request validation schema
 * Requires access token, optional profile info for verification
 */
export const googleAuthSchema = z.object({
  accessToken: z
    .string({ error: 'Google access token is required' })
    .min(1, 'Google access token is required'),
  email: z.email({ error: 'Invalid email format' }).optional(),
  name: z
    .string()
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  picture: z
    .string()
    .url('Invalid picture URL')
    .optional()
})

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>

/**
 * Refresh token request validation schema
 * Requires the refresh token string
 */
export const refreshSchema = z.object({
  refreshToken: z
    .string({ error: 'Refresh token is required' })
    .min(1, 'Refresh token is required')
})

export type RefreshInput = z.infer<typeof refreshSchema>

/**
 * Logout request validation schema
 * Requires the refresh token to revoke
 */
export const logoutSchema = z.object({
  refreshToken: z
    .string({ error: 'Refresh token is required' })
    .min(1, 'Refresh token is required')
})

export type LogoutInput = z.infer<typeof logoutSchema>

/**
 * Helper to extract first error message from Zod validation
 * @param error - Zod error object
 * @returns First error message string
 */
export function getFirstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Validation failed'
}


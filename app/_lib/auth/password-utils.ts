// Secure password utilities using bcrypt for vanilla login
// Implements industry best practices for password hashing and validation

import bcrypt from 'bcryptjs'

// Salt rounds for bcrypt - 12 is a good balance between security and performance
// Higher values = more secure but slower hashing
const SALT_ROUNDS = 12

/**
 * Hash a plain text password using bcrypt with salt
 * @param plainPassword - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 1) {
    throw new Error('Password cannot be empty')
  }

  // Validate password strength (basic requirements)
  if (plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(plainPassword, salt)
    return hashedPassword
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a plain text password against a hashed password
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password from database
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false
  }

  try {
    // Compare the plain password with the hashed password
    const isValid = await bcrypt.compare(plainPassword, hashedPassword)
    return isValid
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Validate password strength requirements
 * @param password - The password to validate
 * @returns object with validation results
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Maximum length check (prevent DoS attacks)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long')
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate a secure random password
 * @param length - Length of the password (default: 16)
 * @returns string - A secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

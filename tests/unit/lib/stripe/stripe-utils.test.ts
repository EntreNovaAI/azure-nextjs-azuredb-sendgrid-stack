/**
 * Tests for Stripe utility functions
 * Specifically testing credit card number detection in customer names
 */

import { describe, it, expect } from 'vitest'
import { looksLikeCreditCardNumber, sanitizeCustomerName } from '@lib/stripe/stripe-utils'

describe('looksLikeCreditCardNumber', () => {
  // Test cases for credit card numbers (should return true)
  it('should detect 16-digit credit card number', () => {
    expect(looksLikeCreditCardNumber('4532015112830366')).toBe(true)
  })

  it('should detect credit card with spaces', () => {
    expect(looksLikeCreditCardNumber('4532 0151 1283 0366')).toBe(true)
  })

  it('should detect credit card with hyphens', () => {
    expect(looksLikeCreditCardNumber('4532-0151-1283-0366')).toBe(true)
  })

  it('should detect 15-digit Amex number', () => {
    expect(looksLikeCreditCardNumber('378282246310005')).toBe(true)
  })

  it('should detect 13-digit card number', () => {
    expect(looksLikeCreditCardNumber('4111111111111')).toBe(true)
  })

  // Test cases for valid names (should return false)
  it('should allow normal names', () => {
    expect(looksLikeCreditCardNumber('John Doe')).toBe(false)
  })

  it('should allow names with numbers', () => {
    expect(looksLikeCreditCardNumber('John Doe 2nd')).toBe(false)
  })

  it('should allow names with special characters', () => {
    expect(looksLikeCreditCardNumber('O\'Brien-Smith')).toBe(false)
  })

  it('should allow short numeric strings', () => {
    expect(looksLikeCreditCardNumber('12345')).toBe(false)
  })

  // Edge cases
  it('should handle null', () => {
    expect(looksLikeCreditCardNumber(null)).toBe(false)
  })

  it('should handle undefined', () => {
    expect(looksLikeCreditCardNumber(undefined)).toBe(false)
  })

  it('should handle empty string', () => {
    expect(looksLikeCreditCardNumber('')).toBe(false)
  })
})

describe('sanitizeCustomerName', () => {
  // Valid names - should pass through
  it('should allow valid customer names', () => {
    expect(sanitizeCustomerName('John Doe')).toBe('John Doe')
  })

  it('should trim whitespace', () => {
    expect(sanitizeCustomerName('  Jane Smith  ')).toBe('Jane Smith')
  })

  it('should allow names with hyphens and apostrophes', () => {
    expect(sanitizeCustomerName('Mary O\'Brien-Jones')).toBe('Mary O\'Brien-Jones')
  })

  // Invalid names - should return null
  it('should reject credit card numbers', () => {
    expect(sanitizeCustomerName('4532015112830366')).toBe(null)
  })

  it('should reject credit card with spaces', () => {
    expect(sanitizeCustomerName('4532 0151 1283 0366')).toBe(null)
  })

  it('should reject credit card with hyphens', () => {
    expect(sanitizeCustomerName('4532-0151-1283-0366')).toBe(null)
  })

  it('should reject single character names', () => {
    expect(sanitizeCustomerName('J')).toBe(null)
  })

  it('should reject empty string after trim', () => {
    expect(sanitizeCustomerName('   ')).toBe(null)
  })

  // Edge cases
  it('should handle null', () => {
    expect(sanitizeCustomerName(null)).toBe(null)
  })

  it('should handle undefined', () => {
    expect(sanitizeCustomerName(undefined)).toBe(null)
  })
})


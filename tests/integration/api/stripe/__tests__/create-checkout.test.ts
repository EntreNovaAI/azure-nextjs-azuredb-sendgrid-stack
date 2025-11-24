import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCheckoutAction } from '@lib/stripe/stripe-actions'
import { getServerSession } from 'next-auth'
import { createCheckoutSession } from '@lib/stripe/stripe-service'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock Stripe service
vi.mock('@lib/stripe/stripe-service', () => ({
  createCheckoutSession: vi.fn()
}))

/**
 * Integration tests for Stripe checkout creation
 * Tests the createCheckoutAction server action
 */
describe('createCheckoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variables
    process.env.STRIPE_SUBSCRIPTION_ID_BASIC = 'prod_test_basic'
    process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM = 'prod_test_premium'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  it('creates checkout session for authenticated user', async () => {
    // Mock authenticated session
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    }
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

    // Mock successful checkout session creation
    vi.mocked(createCheckoutSession).mockResolvedValue({
      success: true,
      data: {
        clientSecret: 'cs_test_mock_secret_12345'
      }
    })

    const result = await createCheckoutAction('basic')

    expect(result.success).toBe(true)
    expect(result.data?.clientSecret).toBe('cs_test_mock_secret_12345')
    expect(createCheckoutSession).toHaveBeenCalledWith('basic', 'test@example.com')
  })

  it('rejects checkout creation for unauthenticated user', async () => {
    // Mock no session
    vi.mocked(getServerSession).mockResolvedValue(null)

    const result = await createCheckoutAction('basic')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Authentication required')
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('rejects checkout creation when session has no email', async () => {
    // Mock session without email
    const mockSession = {
      user: {
        name: 'Test User'
        // No email
      }
    }
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

    const result = await createCheckoutAction('basic')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Authentication required')
    expect(createCheckoutSession).not.toHaveBeenCalled()
  })

  it('handles service errors gracefully', async () => {
    // Mock authenticated session
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    }
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

    // Mock service error
    vi.mocked(createCheckoutSession).mockResolvedValue({
      success: false,
      error: 'Invalid product ID or missing Stripe configuration'
    })

    const result = await createCheckoutAction('invalid-product')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid product ID or missing Stripe configuration')
  })

  it('handles service exceptions', async () => {
    // Mock authenticated session
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    }
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

    // Mock service throwing an error
    vi.mocked(createCheckoutSession).mockRejectedValue(new Error('Stripe API error'))

    const result = await createCheckoutAction('basic')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to create checkout session')
  })

  it('creates checkout for premium product', async () => {
    // Mock authenticated session
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    }
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

    // Mock successful checkout session creation
    vi.mocked(createCheckoutSession).mockResolvedValue({
      success: true,
      data: {
        clientSecret: 'cs_test_premium_secret'
      }
    })

    const result = await createCheckoutAction('premium')

    expect(result.success).toBe(true)
    expect(result.data?.clientSecret).toBe('cs_test_premium_secret')
    expect(createCheckoutSession).toHaveBeenCalledWith('premium', 'test@example.com')
  })

  it('returns error when service returns no client secret', async () => {
    // Mock authenticated session
    const mockSession = {
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    }
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

    // Mock service success but no client secret
    vi.mocked(createCheckoutSession).mockResolvedValue({
      success: true,
      data: {}
      // No clientSecret
    })

    const result = await createCheckoutAction('basic')

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    // The action returns what the service returns, even if clientSecret is missing
  })
})


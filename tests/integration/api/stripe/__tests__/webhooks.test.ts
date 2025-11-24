import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/(api)/api/stripe/webhooks/route'
import { getStripeForWebhooks } from '@lib/stripe/stripe-client'
import { handleStripeWebhookEvent } from '@lib/stripe/stripe-service'

// Mock Stripe client
vi.mock('@lib/stripe/stripe-client', () => ({
  getStripeForWebhooks: vi.fn()
}))

// Mock Stripe service
vi.mock('@lib/stripe/stripe-service', () => ({
  handleStripeWebhookEvent: vi.fn()
}))

/**
 * Integration tests for Stripe webhook handler
 * Tests webhook signature verification and event processing
 */
describe('Stripe Webhook Handler', () => {
  let mockStripe: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    
    // Mock Stripe instance
    mockStripe = {
      webhooks: {
        constructEvent: vi.fn()
      }
    }
    vi.mocked(getStripeForWebhooks).mockReturnValue(mockStripe as any)
  })

  it('processes valid webhook event', async () => {
    // Mock webhook event
    const mockEvent = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          payment_status: 'paid'
        }
      }
    }

    // Mock signature verification (success)
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    vi.mocked(handleStripeWebhookEvent).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=1234567890,v1=test_signature'
      },
      body: JSON.stringify(mockEvent.data.object)
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.received).toBe(true)
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled()
    expect(handleStripeWebhookEvent).toHaveBeenCalledWith(mockEvent)
  })

  it('rejects webhook with invalid signature', async () => {
    // Mock signature verification failure
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_signature'
      },
      body: JSON.stringify({})
    })

    // Should throw error for invalid signature
    await expect(POST(request)).rejects.toThrow('Invalid signature')
    expect(handleStripeWebhookEvent).not.toHaveBeenCalled()
  })

  it('handles missing stripe-signature header', async () => {
    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      body: JSON.stringify({})
      // No stripe-signature header
    })

    // Should fail signature verification
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Missing signature')
    })

    await expect(POST(request)).rejects.toThrow()
  })

  it('processes checkout.session.completed event', async () => {
    const mockEvent = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_123',
          payment_status: 'paid',
          line_items: {
            data: [{
              price: {
                product: 'prod_test_basic'
              }
            }]
          }
        }
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    vi.mocked(handleStripeWebhookEvent).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=1234567890,v1=test_signature'
      },
      body: JSON.stringify(mockEvent.data.object)
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(handleStripeWebhookEvent).toHaveBeenCalledWith(mockEvent)
  })

  it('processes customer.subscription.updated event', async () => {
    const mockEvent = {
      id: 'evt_test_456',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'active'
        }
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    vi.mocked(handleStripeWebhookEvent).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=1234567890,v1=test_signature'
      },
      body: JSON.stringify(mockEvent.data.object)
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(handleStripeWebhookEvent).toHaveBeenCalledWith(mockEvent)
  })

  it('handles webhook processing errors gracefully', async () => {
    const mockEvent = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123'
        }
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    
    // Mock service error
    vi.mocked(handleStripeWebhookEvent).mockRejectedValue(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=1234567890,v1=test_signature'
      },
      body: JSON.stringify(mockEvent.data.object)
    })

    // Should still return 200 to acknowledge receipt
    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.received).toBe(true)
    // Error is logged but webhook is acknowledged
  })

  it('uses correct webhook secret from environment', async () => {
    const mockEvent = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {}
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    vi.mocked(handleStripeWebhookEvent).mockResolvedValue(undefined)

    const request = new Request('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=1234567890,v1=test_signature'
      },
      body: JSON.stringify(mockEvent.data.object)
    })

    await POST(request)

    // Verify webhook secret is used
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
      expect.any(String),
      't=1234567890,v1=test_signature',
      'whsec_test_secret'
    )
  })
})


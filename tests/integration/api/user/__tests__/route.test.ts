import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserAction, updateUserAction } from '@lib/user/user-actions'
import { getCurrentUser, updateUserAccessLevel } from '@lib/user/user-service'
import { getServerSession } from 'next-auth'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

// Mock user service
vi.mock('@lib/user/user-service', () => ({
  getCurrentUser: vi.fn(),
  updateUserAccessLevel: vi.fn()
}))

/**
 * Integration tests for user server actions
 * Tests user data retrieval and updates
 */
describe('User Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserAction', () => {
    it('returns user data for authenticated user', async () => {
      // Mock authenticated session
      const mockSession = {
        user: {
          email: 'test@example.com',
          name: 'Test User'
        }
      }
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

      // Mock user data
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        accessLevel: 'free',
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(getCurrentUser).mockResolvedValue({
        success: true,
        data: mockUser
      })

      const result = await getUserAction()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(getCurrentUser).toHaveBeenCalled()
    })

    it('returns error for unauthenticated user', async () => {
      // Mock no session
      vi.mocked(getServerSession).mockResolvedValue(null)

      vi.mocked(getCurrentUser).mockResolvedValue({
        success: false,
        error: 'Authentication required'
      })

      const result = await getUserAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('handles service errors gracefully', async () => {
      // Mock authenticated session
      const mockSession = {
        user: {
          email: 'test@example.com'
        }
      }
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

      // Mock service error
      vi.mocked(getCurrentUser).mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      })

      const result = await getUserAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('handles exceptions', async () => {
      // Mock authenticated session
      const mockSession = {
        user: {
          email: 'test@example.com'
        }
      }
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any)

      // Mock service throwing error
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unexpected error'))

      const result = await getUserAction()

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred while fetching user data')
    })
  })

  describe('updateUserAction', () => {
    it('updates user access level successfully', async () => {
      const updateData = {
        stripeSessionData: {
          status: 'complete',
          payment_status: 'paid',
          customer_id: 'cus_test_123',
          line_items: [{
            price: {
              product: 'prod_test_basic'
            }
          }]
        }
      }

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        accessLevel: 'basic',
        stripeCustomerId: 'cus_test_123'
      }

      vi.mocked(updateUserAccessLevel).mockResolvedValue({
        success: true,
        data: updatedUser
      })

      const result = await updateUserAction(updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedUser)
      expect(updateUserAccessLevel).toHaveBeenCalledWith(updateData)
    })

    it('handles update errors', async () => {
      const updateData = {
        stripeSessionData: {
          status: 'complete',
          payment_status: 'paid'
        }
      }

      vi.mocked(updateUserAccessLevel).mockResolvedValue({
        success: false,
        error: 'Invalid session data'
      })

      const result = await updateUserAction(updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid session data')
    })

    it('handles exceptions during update', async () => {
      const updateData = {
        stripeSessionData: {}
      }

      vi.mocked(updateUserAccessLevel).mockRejectedValue(new Error('Database error'))

      const result = await updateUserAction(updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred while updating user')
    })

    it('updates user with direct access level', async () => {
      const updateData = {
        accessLevel: 'premium'
      }

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        accessLevel: 'premium'
      }

      vi.mocked(updateUserAccessLevel).mockResolvedValue({
        success: true,
        data: updatedUser
      })

      const result = await updateUserAction(updateData)

      expect(result.success).toBe(true)
      expect(result.data?.accessLevel).toBe('premium')
    })
  })
})


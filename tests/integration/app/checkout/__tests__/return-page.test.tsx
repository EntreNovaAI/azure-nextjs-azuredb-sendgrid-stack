import { expect, test, vi } from 'vitest'
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import CheckoutReturn from '@/app/checkout/return/page'

// Mock Stripe actions
vi.mock('@lib/stripe/stripe-actions', () => ({
  getSessionStatusAction: vi.fn()
}))

// Mock useSearchParams to return null session_id (no session)
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return {
    ...actual,
    useSearchParams: () => ({
      get: (key: string) => key === 'session_id' ? null : null
    }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
  }
})

/**
 * Smoke test for checkout return page
 * Verifies that the page renders without errors
 */
test('Checkout return page renders without errors', () => {
  const { container } = render(
    <SessionProvider session={null}>
      <CheckoutReturn />
    </SessionProvider>
  )
  // Just verify the page renders - no need to check specific content
  expect(container).toBeTruthy()
})

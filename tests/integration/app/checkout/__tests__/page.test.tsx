import { expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import CheckoutPage from '@/app/checkout/page'

/**
 * Smoke test for checkout page
 * Verifies that the page renders without errors
 */
test('Checkout page renders without errors', () => {
  const { container } = render(
    <SessionProvider session={null}>
      <CheckoutPage />
    </SessionProvider>
  )
  // Just verify the page renders - no need to check specific content
  expect(container).toBeTruthy()
})

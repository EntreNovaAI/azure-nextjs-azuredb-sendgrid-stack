import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import CheckoutPage from '@/app/checkout/page'

test('Checkout page renders main heading', () => {
  render(
    <SessionProvider session={null}>
      <CheckoutPage />
    </SessionProvider>
  )
  expect(screen.getByRole('heading', { level: 1, name: 'Complete Your Purchase' })).toBeDefined()
})

test('Checkout page shows security notice', () => {
  render(
    <SessionProvider session={null}>
      <CheckoutPage />
    </SessionProvider>
  )
  expect(screen.getByText('🔒 Your payment is secured with Stripe')).toBeDefined()
})

test('Checkout page shows secure checkout description', () => {
  render(
    <SessionProvider session={null}>
      <CheckoutPage />
    </SessionProvider>
  )
  expect(screen.getByText(/Secure checkout powered by Stripe/)).toBeDefined()
})

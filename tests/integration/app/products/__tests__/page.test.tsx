import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import ProductsPage from '@/app/products/page'

test('Products page renders when unauthenticated', () => {
  render(
    <SessionProvider session={null}>
      <ProductsPage />
    </SessionProvider>
  )
  expect(screen.getByText('Please sign in to access our premium products.')).toBeDefined()
})

test('Products page renders with authenticated user', () => {
  const mockSession = {
    user: { 
      id: 'test-user-id',
      name: 'Test User', 
      email: 'test@example.com',
      accessLevel: 'free'
    },
    expires: '2024-12-31'
  }

  render(
    <SessionProvider session={mockSession}>
      <ProductsPage />
    </SessionProvider>
  )
  expect(screen.getByText('Please wait while we load your products.')).toBeDefined()
})

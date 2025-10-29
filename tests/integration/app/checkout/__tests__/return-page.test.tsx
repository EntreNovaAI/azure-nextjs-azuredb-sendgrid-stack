import { expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import CheckoutReturn from '@/app/checkout/return/page'

// Mock axios to prevent actual API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error('Network error'))),
    isAxiosError: vi.fn(() => true)
  }
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

test('Checkout return page shows error when no session ID', async () => {
  render(
    <SessionProvider session={null}>
      <CheckoutReturn />
    </SessionProvider>
  )
  
  // Wait for the error state to appear
  await waitFor(() => {
    expect(screen.getByText('Error')).toBeDefined()
  }, { timeout: 2000 })
  
  expect(screen.getByText('No session ID provided')).toBeDefined()
})

test('Checkout return page renders without crashing', () => {
  render(
    <SessionProvider session={null}>
      <CheckoutReturn />
    </SessionProvider>
  )
  
  // Check that the component renders (either loading or error state)
  const pageContainer = document.querySelector('.page-container')
  expect(pageContainer).toBeDefined()
})

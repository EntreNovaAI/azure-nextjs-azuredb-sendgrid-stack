import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import DashboardPage from '@/app/(product)/dashboard/page'

test('Dashboard page renders when unauthenticated', () => {
  render(
    <SessionProvider session={null}>
      <DashboardPage />
    </SessionProvider>
  )
  expect(screen.getByText('Please sign in to access your dashboard.')).toBeDefined()
})

test('Dashboard page renders with authenticated user', () => {
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
      <DashboardPage />
    </SessionProvider>
  )
  expect(screen.getByText('Please wait while we load your dashboard.')).toBeDefined()
})


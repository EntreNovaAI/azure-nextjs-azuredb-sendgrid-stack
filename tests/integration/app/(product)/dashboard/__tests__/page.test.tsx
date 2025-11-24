import { expect, test, vi } from 'vitest'
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import DashboardPage from '@/app/(product)/dashboard/page'

// Mock the getUserAction server action
vi.mock('@lib/user/user-actions', () => ({
  getUserAction: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      accessLevel: 'free'
    }
  }))
}))

/**
 * Smoke test for dashboard page
 * Verifies that the page renders without errors
 */
test('Dashboard page renders without errors', () => {
  const { container } = render(
    <SessionProvider session={null}>
      <DashboardPage />
    </SessionProvider>
  )
  // Just verify the page renders - no need to check specific content
  expect(container).toBeTruthy()
})


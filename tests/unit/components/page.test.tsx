import React from 'react'
import { expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import Page from '@/app/page'

/**
 * Smoke test for home page
 * Verifies that the page renders without errors
 */
test('Home page renders without errors', () => {
  const { container } = render(
    <SessionProvider session={null}>
      <Page />
    </SessionProvider>
  )
  // Just verify the page renders - no need to check specific content
  expect(container).toBeTruthy()
})
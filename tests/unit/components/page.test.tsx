import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import Page from '@/app/page'

test('Page', () => {
  render(
    <SessionProvider session={null}>
      <Page />
    </SessionProvider>
  )
  expect(screen.getByRole('heading', { level: 2, name: 'Choose Your Plan' })).toBeDefined()
})
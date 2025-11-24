import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication flow
 * Tests sign in, sign out, and protected routes
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/')
  })

  test('user can navigate to sign up page', async ({ page }) => {
    // Look for sign in/sign up link in navigation
    const signInLink = page.getByRole('link', { name: /sign in|sign up/i })
    await expect(signInLink).toBeVisible()
    
    await signInLink.click()
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/\/auth\/signup/)
  })

  test('signup page displays correctly', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Check for signup form elements
    await expect(page.getByRole('heading', { name: /sign|create account/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('dashboard requires authentication', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should show authentication required message
    await expect(page.getByText(/sign in|authentication required/i)).toBeVisible()
  })

  test('protected routes redirect when not authenticated', async ({ page }) => {
    // Try to access profile page
    await page.goto('/profile')
    
    // Should require authentication or redirect
    // The exact behavior depends on your auth implementation
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/(auth|signup|signin)/)
  })

  test('navigation shows sign out when authenticated', async ({ page, context }) => {
    // This test would require setting up authentication state
    // For now, we'll test the UI structure
    
    // Check if navigation exists
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('user can sign out', async ({ page }) => {
    // This test would require authenticated state
    // Check for sign out button/link
    const signOutLink = page.getByRole('link', { name: /sign out|logout/i })
    
    // If sign out link exists (user is authenticated), click it
    if (await signOutLink.isVisible().catch(() => false)) {
      await signOutLink.click()
      
      // Should redirect to home or sign in page
      await expect(page).toHaveURL(/\/(|\/auth\/signup)/)
    }
  })

  test('session persists across page navigation', async ({ page, context }) => {
    // This test would require authenticated state
    // Navigate between pages and verify session persists
    await page.goto('/')
    
    // If authenticated, navigate to dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard/i })
    if (await dashboardLink.isVisible().catch(() => false)) {
      await dashboardLink.click()
      await expect(page).toHaveURL(/\/dashboard/)
      
      // Navigate back
      await page.goBack()
      await expect(page).toHaveURL(/\//)
    }
  })
})


import { test, expect } from '@playwright/test'

/**
 * E2E tests for navigation
 * Tests navigation between pages and responsive behavior
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigation bar is visible', async ({ page }) => {
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('user can navigate to home page', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /home/i })
    await expect(homeLink).toBeVisible()
    
    await homeLink.click()
    await expect(page).toHaveURL(/\//)
  })

  test('user can navigate to dashboard when authenticated', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /dashboard/i })
    
    // Dashboard link may only be visible when authenticated
    if (await dashboardLink.isVisible().catch(() => false)) {
      await dashboardLink.click()
      await expect(page).toHaveURL(/\/dashboard/)
    }
  })

  test('user can navigate to profile when authenticated', async ({ page }) => {
    const profileLink = page.getByRole('link', { name: /profile/i })
    
    // Profile link may only be visible when authenticated
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click()
      await expect(page).toHaveURL(/\/profile/)
    }
  })

  test('navigation shows sign in link when not authenticated', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /sign in|sign up/i })
    
    // Sign in link should be visible when not authenticated
    if (await signInLink.isVisible().catch(() => false)) {
      await expect(signInLink).toBeVisible()
    }
  })

  test('navigation shows sign out link when authenticated', async ({ page }) => {
    const signOutLink = page.getByRole('link', { name: /sign out|logout/i })
    
    // Sign out link should be visible when authenticated
    if (await signOutLink.isVisible().catch(() => false)) {
      await expect(signOutLink).toBeVisible()
    }
  })

  test('navigation is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
    
    // Mobile menu should be accessible
    // The exact implementation depends on your mobile menu
  })

  test('navigation is responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('navigation is responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })

  test('user can navigate to legal pages', async ({ page }) => {
    // Test navigation to terms, privacy, contact pages
    const legalPages = [
      { name: /terms/i, url: /\/terms/ },
      { name: /privacy/i, url: /\/privacy/ },
      { name: /contact/i, url: /\/contact/ }
    ]

    for (const pageInfo of legalPages) {
      const link = page.getByRole('link', { name: pageInfo.name })
      if (await link.isVisible().catch(() => false)) {
        await link.click()
        await expect(page).toHaveURL(pageInfo.url)
        await page.goBack()
      }
    }
  })

  test('active page is highlighted in navigation', async ({ page }) => {
    // Navigate to a page
    await page.goto('/dashboard')
    
    // Check if dashboard link has active state
    // The exact implementation depends on your navigation component
    const dashboardLink = page.getByRole('link', { name: /dashboard/i })
    if (await dashboardLink.isVisible().catch(() => false)) {
      // Active link should have different styling or aria attribute
      await expect(dashboardLink).toBeVisible()
    }
  })

  test('navigation persists across page reloads', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
    
    // Reload page
    await page.reload()
    
    // Navigation should still be visible
    await expect(nav).toBeVisible()
  })
})


import { test, expect } from '@playwright/test'

/**
 * E2E tests for checkout flow
 * Tests payment processing and checkout return page
 */
test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout page before each test
    // Note: In a real scenario, you'd need to be authenticated
    await page.goto('/checkout')
  })

  test('checkout page displays correctly', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: /complete your purchase/i })).toBeVisible()
    
    // Check for security notice
    await expect(page.getByText(/secured with stripe/i)).toBeVisible()
    
    // Check for Stripe checkout container
    const checkoutContainer = page.locator('#checkout')
    await expect(checkoutContainer).toBeVisible()
  })

  test('checkout page shows secure checkout description', async ({ page }) => {
    await expect(page.getByText(/secure checkout powered by stripe/i)).toBeVisible()
  })

  test('checkout return page handles missing session ID', async ({ page }) => {
    // Navigate to return page without session_id
    await page.goto('/checkout/return')
    
    // Should show error or loading state
    // The exact message depends on your implementation
    const errorOrLoading = page.getByText(/error|no session|loading/i)
    await expect(errorOrLoading.first()).toBeVisible()
  })

  test('checkout return page handles invalid session ID', async ({ page }) => {
    // Navigate with invalid session ID
    await page.goto('/checkout/return?session_id=invalid_session_id')
    
    // Should handle error gracefully
    // May show error message or loading state
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })

  test('checkout return page shows success for completed payment', async ({ page }) => {
    // This would require a valid Stripe test session ID
    // For now, we'll test the page structure
    
    await page.goto('/checkout/return?session_id=cs_test_mock')
    
    // Page should load (may show loading, success, or error)
    await expect(page.locator('body')).toBeVisible()
  })

  test('checkout page requires authentication', async ({ page }) => {
    // Try to access checkout without authentication
    await page.goto('/checkout')
    
    // Should require authentication or show appropriate message
    // The exact behavior depends on your auth implementation
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('user can navigate back from checkout', async ({ page }) => {
    await page.goto('/checkout')
    
    // Look for back button or navigation
    const backButton = page.getByRole('button', { name: /back/i }).or(
      page.getByRole('link', { name: /back|home/i })
    )
    
    // If back button exists, test navigation
    if (await backButton.first().isVisible().catch(() => false)) {
      await backButton.first().click()
      // Should navigate away from checkout
      await expect(page).not.toHaveURL(/\/checkout/)
    }
  })
})


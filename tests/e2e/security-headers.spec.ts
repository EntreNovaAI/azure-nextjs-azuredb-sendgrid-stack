import { test, expect } from '@playwright/test'

/**
 * E2E tests for security headers
 * Verifies that security headers are actually returned by the server
 * These tests require a running dev server (pnpm dev)
 */

test.describe('Security Headers', () => {
  test('should return X-Frame-Options header', async ({ page }) => {
    const response = await page.goto('/')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    expect(headers['x-frame-options']).toBe('DENY')
  })

  test('should return X-Content-Type-Options header', async ({ page }) => {
    const response = await page.goto('/')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    expect(headers['x-content-type-options']).toBe('nosniff')
  })

  test('should return Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('should return X-XSS-Protection header', async ({ page }) => {
    const response = await page.goto('/')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    expect(headers['x-xss-protection']).toBe('1; mode=block')
  })

  test('should return Permissions-Policy header', async ({ page }) => {
    const response = await page.goto('/')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    const permissionsPolicy = headers['permissions-policy']
    expect(permissionsPolicy).toBeTruthy()
    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('microphone=()')
    expect(permissionsPolicy).toContain('geolocation=()')
  })

  test('should return Content-Security-Policy header', async ({ page }) => {
    const response = await page.goto('/')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    const csp = headers['content-security-policy']
    expect(csp).toBeTruthy()
    
    // Should allow self-origin
    expect(csp).toContain("default-src 'self'")
    
    // Should allow Stripe
    expect(csp).toContain('js.stripe.com')
    
    // Should allow Application Insights
    expect(csp).toContain('*.applicationinsights.azure.com')
  })

  test('should return security headers on API routes', async ({ page }) => {
    // Test that headers are applied to API routes too
    const response = await page.goto('/api/health')
    
    expect(response).toBeTruthy()
    const headers = response?.headers() || {}
    
    // Should have security headers even on API routes
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
  })

  test('should return security headers on all routes', async ({ page }) => {
    // Test multiple routes to ensure headers are applied everywhere
    const routes = ['/', '/auth/signup', '/dashboard', '/profile']
    
    for (const route of routes) {
      const response = await page.goto(route)
      
      if (response) {
        const headers = response.headers()
        
        // All routes should have security headers
        expect(headers['x-frame-options']).toBe('DENY')
        expect(headers['x-content-type-options']).toBe('nosniff')
      }
    }
  })
})


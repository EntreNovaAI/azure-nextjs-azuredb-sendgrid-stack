import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * Integration test for security headers configuration
 * Verifies that next.config.js headers() function returns correct security headers
 * This ensures the template is secure by default
 */

describe('Security Headers Configuration', () => {
  // Get the headers function from next.config.js
  // Clear cache to ensure fresh import
  // Path: tests/integration/config/__tests__/ -> root (4 levels up)
  const configPath = require.resolve('../../../../next.config.js')
  delete require.cache[configPath]
  const nextConfig = require('../../../../next.config.js')
  const headersConfig = nextConfig.headers || (() => Promise.resolve([]))

  it('should return headers configuration for all routes', async () => {
    const headers = await headersConfig()
    
    // Should have at least one header configuration
    expect(headers).toBeDefined()
    expect(Array.isArray(headers)).toBe(true)
    expect(headers.length).toBeGreaterThan(0)
    
    // Should have a catch-all route pattern
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    expect(catchAllRoute).toBeDefined()
  })

  it('should include X-Frame-Options header set to DENY', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    
    expect(catchAllRoute).toBeDefined()
    
    const frameOptions = catchAllRoute?.headers.find(h => h.key === 'X-Frame-Options')
    expect(frameOptions).toBeDefined()
    expect(frameOptions?.value).toBe('DENY')
  })

  it('should include X-Content-Type-Options header set to nosniff', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    
    expect(catchAllRoute).toBeDefined()
    
    const contentTypeOptions = catchAllRoute?.headers.find(h => h.key === 'X-Content-Type-Options')
    expect(contentTypeOptions).toBeDefined()
    expect(contentTypeOptions?.value).toBe('nosniff')
  })

  it('should include Referrer-Policy header', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    
    expect(catchAllRoute).toBeDefined()
    
    const referrerPolicy = catchAllRoute?.headers.find(h => h.key === 'Referrer-Policy')
    expect(referrerPolicy).toBeDefined()
    expect(referrerPolicy?.value).toBe('strict-origin-when-cross-origin')
  })

  it('should include X-XSS-Protection header', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    
    expect(catchAllRoute).toBeDefined()
    
    const xssProtection = catchAllRoute?.headers.find(h => h.key === 'X-XSS-Protection')
    expect(xssProtection).toBeDefined()
    expect(xssProtection?.value).toBe('1; mode=block')
  })

  it('should include Permissions-Policy header', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    
    expect(catchAllRoute).toBeDefined()
    
    const permissionsPolicy = catchAllRoute?.headers.find(h => h.key === 'Permissions-Policy')
    expect(permissionsPolicy).toBeDefined()
    expect(permissionsPolicy?.value).toContain('camera=()')
    expect(permissionsPolicy?.value).toContain('microphone=()')
    expect(permissionsPolicy?.value).toContain('geolocation=()')
  })

  it('should include Content-Security-Policy header', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    
    expect(catchAllRoute).toBeDefined()
    
    const csp = catchAllRoute?.headers.find(h => h.key === 'Content-Security-Policy')
    expect(csp).toBeDefined()
    expect(csp?.value).toBeTruthy()
    
    const cspValue = csp?.value || ''
    
    // Should allow self-origin
    expect(cspValue).toContain("default-src 'self'")
    
    // Should allow Stripe scripts
    expect(cspValue).toContain('js.stripe.com')
    
    // Should allow Application Insights
    expect(cspValue).toContain('*.applicationinsights.azure.com')
    
    // Should allow Stripe frames
    expect(cspValue).toContain('frame-src js.stripe.com')
    
    // Should allow inline scripts/styles for Next.js hydration
    expect(cspValue).toContain("'unsafe-inline'")
  })

  it('should allow Stripe domains in CSP', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    const csp = catchAllRoute?.headers.find(h => h.key === 'Content-Security-Policy')
    const cspValue = csp?.value || ''
    
    // Check for Stripe script source
    expect(cspValue).toMatch(/script-src[^;]*js\.stripe\.com/)
    
    // Check for Stripe image source
    expect(cspValue).toMatch(/img-src[^;]*\*\.stripe\.com/)
    
    // Check for Stripe connect source
    expect(cspValue).toMatch(/connect-src[^;]*\*\.stripe\.com/)
  })

  it('should allow Application Insights in CSP', async () => {
    const headers = await headersConfig()
    const catchAllRoute = headers.find(h => h.source === '/:path*')
    const csp = catchAllRoute?.headers.find(h => h.key === 'Content-Security-Policy')
    const cspValue = csp?.value || ''
    
    // Should allow Application Insights for monitoring
    expect(cspValue).toMatch(/connect-src[^;]*\*\.applicationinsights\.azure\.com/)
  })
})


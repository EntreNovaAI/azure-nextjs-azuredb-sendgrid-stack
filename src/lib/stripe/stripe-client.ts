/**
 * Stripe Client Configuration
 * Centralized Stripe initialization to prevent API version issues
 * 
 * APPROACH: Use account default API version instead of pinning
 * This prevents build breaks when Stripe releases new API versions
 * You control the version from your Stripe Dashboard settings
 * 
 * Benefits:
 * - No build failures from TypeScript type mismatches
 * - Update API version on your schedule from Stripe Dashboard
 * - Test changes before rolling out to production
 * - Single source of truth for Stripe configuration
 * 
 * IMPORTANT: Lazy initialization prevents build-time errors
 * In production (Azure Container Apps), secrets are injected at runtime from Key Vault
 * During build, STRIPE_SECRET_KEY won't exist yet, so we defer initialization
 */

import Stripe from 'stripe'

// Lazy-initialized Stripe instance
let stripeInstance: Stripe | null = null

/**
 * Get the Stripe client instance (lazy initialization)
 * This prevents errors during Docker build when secrets aren't available yet
 * In production, secrets are injected at runtime from Azure Key Vault
 */
function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  // Validate required environment variable at runtime (not at module import)
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
  }

  // Initialize Stripe with account default API version
  // This prevents breaking changes when Stripe updates their API
  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Note: No apiVersion specified - uses account default
    // This is more stable than pinning to a specific version
    typescript: true, // Enable TypeScript support
    telemetry: false, // Disable telemetry for faster requests
  })

  return stripeInstance
}

/**
 * Shared Stripe Client Instance
 * Uses account's default API version from Stripe Dashboard
 * 
 * To upgrade API version:
 * 1. Go to Stripe Dashboard > Developers > API version
 * 2. Test in a development environment first
 * 3. Upgrade when ready (no code changes needed)
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    // Lazy-load Stripe on first access
    return getStripeInstance()[prop as keyof Stripe]
  }
})

/**
 * For webhook signature verification, we need a separate instance
 * since webhooks may need different configuration
 */
export const getStripeForWebhooks = () => {
  // Validate at runtime (not at build time)
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
    telemetry: false,
  })
}

// Export Stripe types for convenience
export type { Stripe }


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
 */

import Stripe from 'stripe'

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

/**
 * Shared Stripe Client Instance
 * Uses account's default API version from Stripe Dashboard
 * This prevents breaking changes when Stripe updates their API
 * 
 * To upgrade API version:
 * 1. Go to Stripe Dashboard > Developers > API version
 * 2. Test in a development environment first
 * 3. Upgrade when ready (no code changes needed)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Note: No apiVersion specified - uses account default
  // This is more stable than pinning to a specific version
  typescript: true, // Enable TypeScript support
  telemetry: false, // Disable telemetry for faster requests
})

/**
 * For webhook signature verification, we need a separate instance
 * since webhooks may need different configuration
 */
export const getStripeForWebhooks = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    telemetry: false,
  })
}

// Export Stripe types for convenience
export type { Stripe }


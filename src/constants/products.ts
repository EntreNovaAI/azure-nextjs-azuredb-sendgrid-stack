/**
 * Products Constants
 * Centralized product/subscription configuration
 * Single source of truth for all product information across the app
 * 
 * Features are now generated dynamically from the feature definitions system
 * to ensure consistency between pricing cards and actual feature access.
 */

import { FEATURES, type PlanId, type FeatureId } from '@/src/product/features/definitions'
import { hasFeature, getFeatureLimit } from '@/src/product/features/access'

// Product interface used throughout the application
export interface Product {
  id: string
  title: string
  description: string
  features: string[]
  variant: 'default' | 'basic' | 'premium'
  // Note: No displayPrice - prices are fetched dynamically from Stripe
  // This ensures prices are always up-to-date with your Stripe dashboard
}

// Type-safe product ID constants
export const PRODUCT_IDS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
} as const

/**
 * Format feature limit for display in pricing cards
 * Converts limit values to user-friendly strings
 */
function formatFeatureLimit(limit: boolean | number | 'unlimited'): string {
  if (limit === true) return 'Included'
  if (limit === false) return 'Not included'
  if (limit === 'unlimited') return 'Unlimited'
  return limit.toString()
}

/**
 * Generate feature list for a plan from the central feature definitions
 * Returns formatted feature strings suitable for pricing cards
 */
function generateFeaturesForPlan(plan: PlanId): string[] {
  const features: string[] = []
  
  // Iterate through all features and format them for display
  for (const featureId of Object.keys(FEATURES) as FeatureId[]) {
    const feature = FEATURES[featureId]
    const limit = getFeatureLimit(plan, featureId)
    
    // Only include enabled features in the list
    if (hasFeature(plan, featureId)) {
      // Format based on limit type
      if (typeof limit === 'number') {
        features.push(`${feature.displayName}: ${limit}`)
      } else if (limit === 'unlimited') {
        features.push(`${feature.displayName}: Unlimited`)
      } else {
        features.push(feature.displayName)
      }
    }
  }
  
  return features
}

/**
 * Product configurations
 * Features are now generated dynamically from the central feature definitions
 * Update src/product/features/definitions.ts to change features across the app
 */
export const products: Product[] = [
  {
    id: PRODUCT_IDS.FREE,
    title: '🚀 Free Plan',
    description: 'Perfect for beginners getting started with our platform.',
    features: generateFeaturesForPlan('free'),
    variant: 'default'
    // Free plan has no price
  },
  {
    id: PRODUCT_IDS.BASIC,
    title: '⭐ Basic Plan',
    description: 'Advanced features for growing businesses.',
    features: generateFeaturesForPlan('basic'),
    variant: 'basic'
    // Price is fetched dynamically from Stripe API
  },
  {
    id: PRODUCT_IDS.PREMIUM,
    title: '📱 Premium Plan',
    description: 'Complete solution for large organizations.',
    features: generateFeaturesForPlan('premium'),
    variant: 'premium'
    // Price is fetched dynamically from Stripe API
  }
]

/**
 * Get a product by its ID
 * Returns undefined if product not found
 */
export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id)
}

/**
 * Format access level for display
 * Converts internal access level codes to user-friendly display names
 * 
 * @param level - The access level code ('free', 'basic', 'premium')
 * @returns User-friendly display name
 */
export function formatAccessLevel(level: string): string {
  switch (level) {
    case 'free':
      return 'Free Plan'
    case 'basic':
      return 'Basic Plan'
    case 'premium':
      return 'Premium Plan'
    default:
      return 'Unknown Plan'
  }
}

/**
 * Get all paid products (excludes free tier)
 */
export function getPaidProducts(): Product[] {
  return products.filter(product => product.id !== PRODUCT_IDS.FREE)
}

/**
 * Check if a product ID is valid
 */
export function isValidProductId(id: string): boolean {
  return products.some(product => product.id === id)
}


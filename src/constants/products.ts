/**
 * Products Constants
 * Centralized product/subscription configuration
 * Single source of truth for all product information across the app
 */

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
 * Product configurations
 * Update these to change product information across the entire app
 */
export const products: Product[] = [
  {
    id: PRODUCT_IDS.FREE,
    title: '🚀 Free Plan',
    description: 'Perfect for beginners getting started with our platform.',
    features: [
      'Basic features',
      'Email support'
    ],
    variant: 'default'
    // Free plan has no price
  },
  {
    id: PRODUCT_IDS.BASIC,
    title: '⭐ Basic Plan',
    description: 'Advanced features for growing businesses.',
    features: [
      'All Free features',
      'Priority support',
      'Advanced analytics'
    ],
    variant: 'basic'
    // Price is fetched dynamically from Stripe API
  },
  {
    id: PRODUCT_IDS.PREMIUM,
    title: '📱 Premium Plan',
    description: 'Complete solution for large organizations.',
    features: [
      'All Basic features',
      'Custom integrations',
      'Dedicated account manager'
    ],
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


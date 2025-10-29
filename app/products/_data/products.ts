export interface Product {
  id: string
  title: string
  description: string
  features: string[]
  price: string
  variant: 'default' | 'basic' | 'premium'
}

/**
 * Product Data
 * Centralized product/subscription tier information
 * Makes it easy to update pricing and features
 */
export const products: Product[] = [
  {
    id: 'free',
    title: '🚀 Free Plan',
    description: 'Perfect for beginners getting started with our platform.',
    features: [
      'Basic features',
      'Email support'
    ],
    price: 'Free',
    variant: 'default'
  },
  {
    id: 'basic',
    title: '⭐ Basic Plan',
    description: 'Advanced features for growing businesses.',
    features: [
      'All Free features',
      'Priority support',
      'Advanced analytics'
    ],
    price: '$9.99/month',
    variant: 'basic'
  },
  {
    id: 'premium',
    title: '🏢 Premium Plan',
    description: 'Complete solution for large organizations.',
    features: [
      'All Basic features',
      'Custom integrations',
      'Dedicated account manager'
    ],
    price: '$29.99/month',
    variant: 'premium'
  }
]



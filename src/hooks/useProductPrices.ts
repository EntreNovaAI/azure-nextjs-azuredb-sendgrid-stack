/**
 * useProductPrices Hook
 * Fetches and caches product prices from Stripe API
 * Provides loading states and formatted pricing information
 */

'use client'

import { useState, useEffect } from 'react'
import { fetchStripePricesAction } from '@lib/stripe/stripe-actions'
import { products } from '@constants/products'

// Price information returned by the hook
interface PriceInfo {
  amount: number
  currency: string
  interval: string
}

// Hook return type
interface UseProductPricesReturn {
  prices: Record<string, string>  // Formatted prices like { basic: '$9.99', premium: '$29.99' }
  loading: boolean
  error: string | null
}

/**
 * Custom hook to fetch and format product prices from Stripe
 * Falls back to displayPrice from constants if Stripe fetch fails
 * Caches results to prevent repeated API calls
 */
export function useProductPrices(): UseProductPricesReturn {
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true  // Track if component is still mounted
    
    async function fetchPrices() {
      try {
        // Call server action to fetch prices from Stripe
        const result = await fetchStripePricesAction()
        
        // Only update state if component is still mounted
        if (!isMounted) return
        
        if (result.success && result.data) {
          // Format the prices from Stripe data
          const formattedPrices: Record<string, string> = {}
          
          // Process basic price
          if (result.data.basic) {
            formattedPrices.basic = formatPrice(result.data.basic)
          } else {
            // Fallback to displayPrice from constants
            const basicProduct = products.find(p => p.id === 'basic')
            formattedPrices.basic = basicProduct?.displayPrice || '$9.99'
          }
          
          // Process premium price
          if (result.data.premium) {
            formattedPrices.premium = formatPrice(result.data.premium)
          } else {
            // Fallback to displayPrice from constants
            const premiumProduct = products.find(p => p.id === 'premium')
            formattedPrices.premium = premiumProduct?.displayPrice || '$29.99'
          }
          
          // Set free price (always free)
          formattedPrices.free = 'Free'
          
          setPrices(formattedPrices)
          setError(null)
        } else {
          // If Stripe fetch fails, use displayPrice from constants
          console.warn('Failed to fetch prices from Stripe, using fallback prices')
          const fallbackPrices = getFallbackPrices()
          setPrices(fallbackPrices)
          setError(result.error || 'Failed to fetch live prices')
        }
      } catch (err) {
        console.error('Error fetching prices:', err)
        
        // Only update state if component is still mounted
        if (!isMounted) return
        
        // Use fallback prices from constants
        const fallbackPrices = getFallbackPrices()
        setPrices(fallbackPrices)
        setError('Error loading prices')
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    fetchPrices()
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, [])  // Empty dependency array = run once on mount
  
  return { prices, loading, error }
}

/**
 * Format a price object into a display string
 * Example: { amount: 9.99, currency: 'USD', interval: 'month' } -> '$9.99'
 */
function formatPrice(priceInfo: PriceInfo): string {
  const { amount, currency } = priceInfo
  
  // Format currency symbol
  const currencySymbol = getCurrencySymbol(currency)
  
  // Format the amount with proper decimal places
  const formattedAmount = amount.toFixed(2)
  
  return `${currencySymbol}${formattedAmount}`
}

/**
 * Get currency symbol from currency code
 */
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    // Add more currencies as needed
  }
  
  return symbols[currency.toUpperCase()] || currency.toUpperCase() + ' '
}

/**
 * Get fallback prices from product constants
 * Used when Stripe API is unavailable
 */
function getFallbackPrices(): Record<string, string> {
  const fallbackPrices: Record<string, string> = {}
  
  products.forEach(product => {
    if (product.displayPrice) {
      fallbackPrices[product.id] = product.displayPrice
    }
  })
  
  return fallbackPrices
}


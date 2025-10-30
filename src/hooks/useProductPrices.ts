/**
 * useProductPrices Hook
 * Fetches and caches product prices from Stripe API
 * Provides loading states and formatted pricing information
 * No fallback prices - always fetches from Stripe for accuracy
 */

'use client'

import { useState, useEffect } from 'react'
import { fetchStripePricesAction } from '@lib/stripe/stripe-actions'

// Price information returned by the hook
interface PriceInfo {
  amount: number
  currency: string
  interval: string
}

// Hook return type
interface UseProductPricesReturn {
  prices: Record<string, string>  // Formatted prices fetched from Stripe API
  loading: boolean
  error: string | null
}

/**
 * Custom hook to fetch and format product prices from Stripe
 * Always fetches from Stripe - no fallback prices for accuracy
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
            // No price found - likely misconfigured in Stripe
            console.warn('Basic price not found in Stripe')
            formattedPrices.basic = 'Contact Sales'
          }
          
          // Process premium price
          if (result.data.premium) {
            formattedPrices.premium = formatPrice(result.data.premium)
          } else {
            // No price found - likely misconfigured in Stripe
            console.warn('Premium price not found in Stripe')
            formattedPrices.premium = 'Contact Sales'
          }
          
          // Set free price (always free)
          formattedPrices.free = 'Free'
          
          setPrices(formattedPrices)
          setError(null)
        } else {
          // If Stripe fetch fails, show error message
          console.error('Failed to fetch prices from Stripe:', result.error)
          
          // Set placeholder prices to show something
          setPrices({
            free: 'Free',
            basic: 'Unavailable',
            premium: 'Unavailable'
          })
          setError(result.error || 'Failed to fetch live prices')
        }
      } catch (err) {
        console.error('Error fetching prices:', err)
        
        // Only update state if component is still mounted
        if (!isMounted) return
        
        // Set placeholder prices on error
        setPrices({
          free: 'Free',
          basic: 'Unavailable',
          premium: 'Unavailable'
        })
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



/**
 * Stripe Utility Functions
 * Helper functions for processing Stripe data and determining user access levels
 */

/**
 * Determines the access level based on Stripe line items
 * Maps Stripe product IDs to our internal access levels
 * Uses product IDs instead of price IDs because price IDs can change over time
 * @param lineItems - Array of Stripe line items
 * @param basicProductId - The Stripe product ID for basic subscription
 * @param premiumProductId - The Stripe product ID for premium subscription
 */
export function determineAccessLevelFromLineItems(
  lineItems: any[], 
  basicProductId: string | undefined, 
  premiumProductId: string | undefined
): string {
  // Early return if product IDs are missing
  if (!basicProductId || !premiumProductId) {
    console.error('❌ Missing Stripe subscription product IDs - check server configuration')
    console.error('STRIPE_SUBSCRIPTION_ID_BASIC:', basicProductId ? 'SET' : 'MISSING')
    console.error('STRIPE_SUBSCRIPTION_ID_PREMIUM:', premiumProductId ? 'SET' : 'MISSING')
    return 'free' // Default to free if configuration is missing
  }
  
  // Product ID and price ID logging removed to prevent sensitive identifier exposure
  // These identifiers are sensitive and should not be logged
  
  // Check each line item to find the matching product ID
  for (const item of lineItems) {
    const priceId = item.price?.id
    // Extract product ID from the price object
    // Can be either a string ID or a full product object
    const productId = typeof item.price?.product === 'string' 
      ? item.price.product 
      : item.price?.product?.id
    
    // Compare product IDs without logging sensitive identifiers
    if (productId === premiumProductId) {
      return 'premium'
    } else if (productId === basicProductId) {
      return 'basic'
    }
  }
  
  // Default to free if no matching product ID found
  return 'free'
}

/**
 * Validates if a Stripe customer ID is valid format
 * Stripe customer IDs start with 'cus_'
 */
export function isValidStripeCustomerId(customerId: string | null): boolean {
  if (!customerId || typeof customerId !== 'string') {
    return false
  }
  
  return customerId.startsWith('cus_') && customerId.length > 4
}

/**
 * Checks if a string looks like a credit card number
 * Credit card numbers are typically 13-19 digits, may contain spaces/hyphens
 * This prevents credit card numbers from being used as customer names
 * 
 * @param value - The string to check
 * @returns true if it looks like a credit card number, false otherwise
 */
export function looksLikeCreditCardNumber(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') {
    return false
  }
  
  // Remove common separators (spaces, hyphens, dots)
  const cleanValue = value.replace(/[\s\-\.]/g, '')
  
  // Check if it's mostly digits (allow for some non-digits but majority should be digits)
  const digitCount = (cleanValue.match(/\d/g) || []).length
  const totalLength = cleanValue.length
  
  // If less than 13 chars, can't be a credit card
  if (totalLength < 13) {
    return false
  }
  
  // If more than 90% of characters are digits and length is in credit card range (13-19)
  // then it's likely a credit card number
  const digitPercentage = digitCount / totalLength
  
  if (digitPercentage >= 0.9 && totalLength >= 13 && totalLength <= 19) {
    console.log('Detected potential credit card number in name field - blocking update')
    return true
  }
  
  return false
}

/**
 * Sanitizes and validates a customer name from Stripe
 * Prevents credit card numbers and other invalid data from being used as names
 * 
 * @param name - The name from Stripe customer data
 * @returns The sanitized name, or null if invalid
 */
export function sanitizeCustomerName(name: string | null | undefined): string | null {
  if (!name || typeof name !== 'string') {
    return null
  }
  
  // Trim whitespace
  const trimmedName = name.trim()
  
  // Check if it looks like a credit card number
  if (looksLikeCreditCardNumber(trimmedName)) {
    console.warn('Blocked credit card number from being used as customer name')
    return null
  }
  
  // Check for minimum reasonable name length (at least 2 characters)
  if (trimmedName.length < 2) {
    return null
  }
  
  // Name passed all validation checks
  return trimmedName
}

/**
 * Extracts relevant user update data from Stripe session
 * Returns the data needed to update user profile in database
 * Uses product IDs (not price IDs) for stable matching as prices can change
 * @param sessionData - Stripe session data from get-session-status API
 * @param basicProductId - The Stripe product ID for basic subscription  
 * @param premiumProductId - The Stripe product ID for premium subscription
 */
export function extractUserUpdateData(
  sessionData: any,
  basicProductId?: string,
  premiumProductId?: string
) {
  // Session data logging removed to prevent sensitive customer data exposure
  // Customer IDs, emails, and session data are sensitive and should not be logged
  
  const accessLevel = determineAccessLevelFromLineItems(
    sessionData.line_items || [], 
    basicProductId, 
    premiumProductId
  )
  
  // Extract customer ID (should now always be a string from our API)
  const stripeCustomerId = sessionData.customer_id
  
  const result = {
    accessLevel,
    stripeCustomerId: isValidStripeCustomerId(stripeCustomerId) ? stripeCustomerId : null,
    customerEmail: sessionData.customer_email
  }
  
  // Update data logging removed to prevent sensitive customer data exposure
  // Result contains customer ID and email which are sensitive
  
  return result
}

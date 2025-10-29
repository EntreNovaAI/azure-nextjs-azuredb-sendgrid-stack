
/**
 * Stripe Utility Functions
 * Helper functions for processing Stripe data and determining user access levels
 */

/**
 * Determines the access level based on Stripe line items
 * Maps Stripe price IDs to our internal access levels
 * @param lineItems - Array of Stripe line items
 * @param basicPriceId - The Stripe price ID for basic subscription
 * @param premiumPriceId - The Stripe price ID for premium subscription
 */
export function determineAccessLevelFromLineItems(
  lineItems: any[], 
  basicPriceId: string | undefined, 
  premiumPriceId: string | undefined
): string {
  // Early return if price IDs are missing
  if (!basicPriceId || !premiumPriceId) {
    console.error('Missing Stripe subscription price IDs - check server configuration')
    return 'free' // Default to free if configuration is missing
  }
  
  // Check each line item to find the matching price ID
  for (const item of lineItems) {
    console.log('Processing line item:', item)
    const priceId = item.price?.id
    console.log('Found price ID:', priceId)
    
    // Compare price IDs without logging the sensitive server-side price IDs
    if (priceId === premiumPriceId) {
      console.log('Matched premium subscription')
      return 'premium'
    } else if (priceId === basicPriceId) {
      console.log('Matched basic subscription')
      return 'basic'
    }
  }
  
  // Default to free if no matching price ID found
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
 * Extracts relevant user update data from Stripe session
 * Returns the data needed to update user profile in database
 * @param sessionData - Stripe session data from get-session-status API
 * @param basicPriceId - The Stripe price ID for basic subscription  
 * @param premiumPriceId - The Stripe price ID for premium subscription
 */
export function extractUserUpdateData(
  sessionData: any,
  basicPriceId?: string,
  premiumPriceId?: string
) {
  console.log('=== PROCESSING STRIPE SESSION DATA ===')
  console.log('Session data keys:', Object.keys(sessionData))
  console.log('Customer ID type:', typeof sessionData.customer_id)
  console.log('Customer ID value:', sessionData.customer_id)
  console.log('Customer email:', sessionData.customer_email)
  console.log('Line items count:', sessionData.line_items?.length || 0)
  
  const accessLevel = determineAccessLevelFromLineItems(
    sessionData.line_items || [], 
    basicPriceId, 
    premiumPriceId
  )
  
  // Extract customer ID (should now always be a string from our API)
  const stripeCustomerId = sessionData.customer_id
  
  const result = {
    accessLevel,
    stripeCustomerId: isValidStripeCustomerId(stripeCustomerId) ? stripeCustomerId : null,
    customerEmail: sessionData.customer_email
  }
  
  console.log('=== EXTRACTED USER UPDATE DATA ===')
  console.log('Result:', result)
  console.log('=== END PROCESSING ===')
  
  return result
}

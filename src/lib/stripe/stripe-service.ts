// Stripe Service
// Core business logic for Stripe operations
// Handles checkout sessions, subscription management, and webhook events

import { getServerSession } from 'next-auth'
import { stripe, type Stripe } from '@lib/stripe/stripe-client'
import {
  findUserByStripeCustomerId,
  getUserByEmail,
  linkStripeIdToUserId,
  setAccessLevelById,
  createUser,
  updateUserById
} from '@lib/kysely/repositories/user-repo'
import { extractUserUpdateData, sanitizeCustomerName } from '@lib/stripe/stripe-utils'

// Stripe client is now imported from centralized configuration
// This prevents API version issues and keeps configuration in one place

// Type for service responses
type ServiceResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // Max 5 requests per minute per user

/**
 * Check rate limit for a user
 * Prevents abuse of checkout session creation
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }

  userLimit.count++
  return true
}

/**
 * Fetch the active price ID for a given Stripe product ID
 * This allows us to store product IDs in env vars and dynamically get the price
 * Stripe requires price IDs for checkout, but products can have multiple prices
 * We return the first active price found for the product
 */
async function getPriceIdFromProductId(stripeProductId: string): Promise<string | null> {
  try {
    // Product ID logging removed to prevent sensitive identifier exposure
    
    // Query Stripe API for all active prices associated with this product
    const prices = await stripe.prices.list({
      product: stripeProductId,
      active: true,
      limit: 1 // We only need the first active price
    })
    
    // Return the first active price ID, or null if none found
    if (prices.data.length > 0) {
      const priceId = prices.data[0].id
      // Price ID logging removed to prevent sensitive identifier exposure
      return priceId
    }
    
    // Product ID logging removed to prevent sensitive identifier exposure
    return null
  } catch (error) {
    // Product ID logging removed from error handler to prevent sensitive identifier exposure
    console.error('Error fetching price for product:', error)
    return null
  }
}

/**
 * Fetch price IDs for both basic and premium products from environment
 * Used by webhook handlers to compare incoming Stripe price IDs with our products
 * Returns an object with basic and premium price IDs, or null if not found
 */
async function getConfiguredPriceIds(): Promise<{ basic: string | null; premium: string | null }> {
  const basicProductId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
  const premiumProductId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM
  
  // Fetch price IDs for both products in parallel for efficiency
  const [basicPriceId, premiumPriceId] = await Promise.all([
    basicProductId ? getPriceIdFromProductId(basicProductId) : Promise.resolve(null),
    premiumProductId ? getPriceIdFromProductId(premiumProductId) : Promise.resolve(null)
  ])
  
  return {
    basic: basicPriceId,
    premium: premiumPriceId
  }
}

/**
 * Create a Stripe checkout session
 * Generates a session for embedded checkout flow
 * Requires authenticated user and valid product ID
 */
export async function createCheckoutSession(
  productId: string,
  userEmail: string
): Promise<ServiceResponse> {
  try {
    // User email logging removed to prevent PII exposure

    // Rate limiting check
    if (!checkRateLimit(userEmail)) {
      // User email logging removed to prevent PII exposure
      return {
        success: false,
        error: 'Too many requests. Please try again later.'
      }
    }

    // Get the Stripe product ID from environment variables
    // We now store product IDs (prod_xxx) instead of price IDs
    let stripeProductId: string | null = null

    if (productId === 'basic') {
      stripeProductId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC || null
    } else if (productId === 'premium') {
      stripeProductId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM || null
    } else {
      // Product ID logging removed to prevent sensitive identifier exposure
    }

    // Validate that we have a valid product ID
    if (!stripeProductId) {
      return {
        success: false,
        error: `Invalid product ID "${productId}" or missing Stripe configuration`
      }
    }

    // Fetch the active price ID for this product from Stripe
    // This allows flexibility - products can have multiple prices over time
    const priceId = await getPriceIdFromProductId(stripeProductId)

    if (!priceId) {
      return {
        success: false,
        error: `No active price found for product "${productId}"`
      }
    }

    // Create Stripe checkout session following their documentation pattern
    // Price ID logging removed to prevent sensitive identifier exposure

    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      ui_mode: 'embedded', // Required for embedded checkout
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
    })

    // Return the client secret as shown in Stripe docs
    return {
      success: true,
      data: {
        clientSecret: checkoutSession.client_secret
      }
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)

    return {
      success: false,
      error: 'Failed to create checkout session'
    }
  }
}

/**
 * Get a user's active subscription by Stripe customer ID
 * Returns the first active/trialing subscription if present
 */
export async function getActiveSubscription(stripeCustomerId: string): Promise<ServiceResponse<Stripe.Subscription | null>> {
  try {
    if (!stripeCustomerId || !stripeCustomerId.startsWith('cus_')) {
      return { success: false, error: 'Invalid Stripe customer ID' }
    }

    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      expand: ['data.items']
    })

    const activeSub = subs.data.find(s => s.status === 'active' || s.status === 'trialing') || null

    return { success: true, data: activeSub }
  } catch (error) {
    console.error('Error fetching active subscription:', error)
    return { success: false, error: 'Failed to fetch active subscription' }
  }
}

/**
 * Upgrade subscription immediately with proration
 * - Uses proration_behavior: 'create_prorations'
 * - Uses payment_behavior: 'default_incomplete' to support SCA when needed
 * - Returns client_secret when payment confirmation is required
 */
export async function upgradeSubscription(subscriptionId: string, newPriceId: string): Promise<ServiceResponse<{ clientSecret?: string; invoiceId?: string }>> {
  try {
    if (!subscriptionId?.startsWith('sub_') || !newPriceId) {
      return { success: false, error: 'Invalid parameters' }
    }

    // Retrieve subscription to get current item id
    const current = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] })
    const currentItem = current.items.data[0]
    if (!currentItem) {
      return { success: false, error: 'No subscription items to update' }
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPriceId,
          quantity: currentItem.quantity ?? 1,
        }
      ],
      proration_behavior: 'create_prorations',
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    })

    const invoice = updated.latest_invoice as Stripe.Invoice | null
    const paymentIntent = ((updated.latest_invoice as any)?.payment_intent as Stripe.PaymentIntent | null) || null

    return {
      success: true,
      data: {
        clientSecret: paymentIntent?.client_secret || undefined,
        invoiceId: invoice?.id
      }
    }
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return { success: false, error: 'Failed to upgrade subscription' }
  }
}

/**
 * Schedule a downgrade at period end using Subscription Schedules
 * - Creates a schedule from the current subscription
 * - Phase 1: keep current plan until current_period_end
 * - Phase 2: switch to lower plan starting at current_period_end
 */
export async function scheduleDowngrade(subscriptionId: string, newPriceId: string): Promise<ServiceResponse<{ scheduleId: string; effectiveAt: number }>> {
  try {
    if (!subscriptionId?.startsWith('sub_') || !newPriceId) {
      return { success: false, error: 'Invalid parameters' }
    }

    const current = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] })
    const currentItem = current.items.data[0]
    if (!currentItem || !(current as any).current_period_end) {
      return { success: false, error: 'Subscription missing required data' }
    }

    const effectiveAt = (current as any).current_period_end

    // Create a schedule with two phases
    const schedule = await (stripe.subscriptionSchedules as any).create({
      from_subscription: subscriptionId,
      end_behavior: 'release',
      phases: [
        {
          items: [
            {
              price: currentItem.price.id,
              quantity: currentItem.quantity ?? 1,
            }
          ],
          start_date: 'now',
          end_date: effectiveAt,
          proration_behavior: 'none'
        },
        {
          items: [
            {
              price: newPriceId,
              quantity: currentItem.quantity ?? 1,
            }
          ],
          start_date: effectiveAt,
        }
      ]
    })

    return { success: true, data: { scheduleId: schedule.id, effectiveAt } }
  } catch (error) {
    console.error('Error scheduling downgrade:', error)
    return { success: false, error: 'Failed to schedule downgrade' }
  }
}

/**
 * Create a Stripe Billing Portal session for payment method updates
 */
export async function createBillingPortalSession(stripeCustomerId: string): Promise<ServiceResponse<{ url: string }>> {
  try {
    if (!stripeCustomerId?.startsWith('cus_')) {
      return { success: false, error: 'Invalid Stripe customer ID' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile`
    })

    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return { success: false, error: 'Failed to create billing portal session' }
  }
}

/**
 * Get a proration preview using Upcoming Invoice API
 * Simulates switching to a new price and returns totals for preview
 */
export async function getUpcomingInvoicePreview(subscriptionId: string, newPriceId: string): Promise<ServiceResponse<{ amountDue: number; total: number; currency: string; lines: Stripe.InvoiceLineItem[]; prorationAmountNow: number }>> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items', 'customer'] })
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    if (!customerId) {
      return { success: false, error: 'Missing customer for subscription' }
    }

    const prorationDate = Math.floor(Date.now() / 1000)
    const currentItem = subscription.items.data[0]
    if (!currentItem) {
      return { success: false, error: 'No subscription items found' }
    }

    // Debug logging removed to prevent sensitive data exposure
    // Subscription IDs and price IDs are sensitive identifiers

    // Use the correct Stripe Invoice Preview API
    // According to Stripe SDK source, use createPreview but with correct structure
    // subscription_details contains the items to modify
    const upcomingInvoice = await stripe.invoices.createPreview({
      schedule: undefined,
      subscription: subscriptionId,
      subscription_details: {
        items: [
          {
            id: currentItem.id,
            price: newPriceId,
          }
        ],
        proration_date: prorationDate,
        proration_behavior: 'create_prorations',
      },
    })

    const lines: Stripe.InvoiceLineItem[] = upcomingInvoice.lines?.data || []
    
    // Detailed line item logging removed to prevent sensitive data exposure
    // Price IDs and invoice details are sensitive identifiers

    // Calculate the immediate proration charge
    // This is the amount that will be charged RIGHT NOW when upgrading
    // We need to filter for lines in the CURRENT billing period only
    // Lines in future periods should not be included in immediate charge
    let immediateCharge = 0
    const currentPeriodEnd = (subscription as any).current_period_end
    
    lines.forEach((line: any) => {
      // Check if this line is for the current period (not future billing)
      // Proration lines will have a period.end that matches current_period_end
      const lineEndDate = line.period?.end
      
      // Include lines that:
      // 1. Are in the current billing period (period.end <= current_period_end + small buffer)
      // 2. OR have descriptions indicating proration ("Unused time", "Remaining time")
      const isCurrentPeriod = lineEndDate && lineEndDate <= (currentPeriodEnd + 86400) // 1 day buffer
      const isProrationDescription = line.description?.includes('Unused time') || line.description?.includes('Remaining time')
      
      if (isCurrentPeriod || isProrationDescription) {
        const amount = line.amount ?? 0
        // Logging removed to prevent sensitive data exposure
        immediateCharge += amount
      }
    })

    // Logging removed to prevent sensitive financial data exposure

    // Use the calculated immediate charge
    const prorationAmountNow = immediateCharge

    return {
      success: true,
      data: {
        amountDue: upcomingInvoice.amount_due ?? 0,
        total: upcomingInvoice.total ?? 0,
        currency: upcomingInvoice.currency ?? 'usd',
        lines,
        prorationAmountNow,
      }
    }
  } catch (error) {
    console.error('Error retrieving upcoming invoice preview:', error)
    return { success: false, error: 'Failed to retrieve upgrade preview' }
  }
}

/**
 * Get Stripe session status
 * Retrieves comprehensive session information for payment confirmation
 */
export async function getSessionStatus(sessionId: string): Promise<ServiceResponse> {
  try {
    // Validate that session_id is provided
    if (!sessionId) {
      return {
        success: false,
        error: 'session_id is required'
      }
    }

    // Retrieve the Stripe checkout session with expanded data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription', 'customer']
    })

    // Session data logging removed to prevent sensitive identifier exposure
    // Session IDs and customer IDs are sensitive and should not be logged

    // Sanitize customer name to prevent credit card numbers from being exposed
    const rawCustomerName = session.customer_details?.name || null
    const sanitizedCustomerName = sanitizeCustomerName(rawCustomerName)
    
    if (rawCustomerName && !sanitizedCustomerName) {
      // Session ID logging removed to prevent sensitive identifier exposure
      console.warn('Filtered out invalid customer name from session status - name failed validation (likely credit card number or invalid format)')
    }

    // Prepare the response data
    const responseData = {
      // Basic status info
      status: session.status,
      payment_status: session.payment_status,

      // Customer information
      customer_email: session.customer_details?.email || null,
      customer_name: sanitizedCustomerName,
      customer_id:
        typeof session.customer === 'string' ? session.customer : session.customer?.id || null,

      // Subscription information
      subscription_id:
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id || null,

      // Payment information
      amount_total: session.amount_total,
      currency: session.currency,

      // Product information
      line_items: session.line_items?.data || [],

      // Metadata and timestamps
      created: session.created,
      expires_at: session.expires_at,
      metadata: session.metadata || {}
    }

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('Error retrieving session status:', error)

    return {
      success: false,
      error: 'Failed to retrieve session status'
    }
  }
}

/**
 * Cancel user subscription
 * Marks subscription for cancellation at end of billing period
 * Updates user to free access level
 */
export async function cancelSubscription(
  stripeCustomerId: string,
  userEmail: string
): Promise<ServiceResponse> {
  try {
    // Validate Stripe customer ID format
    if (!stripeCustomerId || !stripeCustomerId.startsWith('cus_')) {
      return {
        success: false,
        error: 'Invalid Stripe customer ID'
      }
    }

    // Verify the customer ID belongs to the authenticated user
    const user = await getUserByEmail(userEmail)
    if (!user || user.stripeCustomerId !== stripeCustomerId) {
      return {
        success: false,
        error: 'Unauthorized: Customer ID does not match authenticated user'
      }
    }

    // Check if user is already on free plan
    if (user.accessLevel === 'free') {
      return {
        success: false,
        error: 'You are already on the free plan'
      }
    }

    // User email and customer ID logging removed to prevent PII exposure

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active'
    })

    // Subscription count logging is safe (non-sensitive)

    // Cancel all active subscriptions
    const cancelledSubscriptions = []
    for (const subscription of subscriptions.data) {
      try {
        // Cancel the subscription at the end of the current period
        // This allows users to continue using the service until their billing period ends
        const cancelled = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true
        })

        cancelledSubscriptions.push(cancelled.id)
        // Subscription ID logging removed to prevent sensitive identifier exposure
      } catch (error) {
        // Subscription ID logging removed from error handler to prevent sensitive identifier exposure
        console.error('Error cancelling subscription:', error)
        // Continue with other subscriptions even if one fails
      }
    }

    // If no subscriptions were found or cancelled, still update user to free
    if (cancelledSubscriptions.length === 0) {
      // Logging removed - non-critical operation
    }

    // Update user's access level to free in database
    // Note: The webhook will also handle this when the subscription actually ends
    // But we update it here for immediate UI feedback
    const updatedUser = await updateUserById(user.id, { accessLevel: 'free' })

    // User email logging removed to prevent PII exposure

    // Return success response
    return {
      success: true,
      data: {
        message: 'Successfully unsubscribed',
        cancelledSubscriptions: cancelledSubscriptions,
        newAccessLevel: 'free',
        note: 'Your subscription will end at the end of the current billing period'
      }
    }
  } catch (error) {
    console.error('Error processing unsubscribe request:', error)

    // Handle specific Stripe errors
    if (error instanceof Error && error.name === 'StripeError') {
      return {
        success: false,
        error: `Stripe error: ${error.message}`
      }
    }

    return {
      success: false,
      error: 'Failed to process unsubscribe request'
    }
  }
}

/**
 * Find user by Stripe customer ID, with email fallback
 * Links Stripe ID to user if found by email
 */
async function findUserByStripeId(stripeCustomerId: string, email?: string | null) {
  // First, try to find user by Stripe customer ID
  let user = await findUserByStripeCustomerId(stripeCustomerId)

  if (user) {
    // Customer ID logging removed to prevent sensitive identifier exposure
    return user
  }

  // Fallback: try to find by email and link the Stripe ID
  if (email) {
    const userByEmail = await getUserByEmail(email)

    if (userByEmail) {
      // Link Stripe ID to existing user
      await linkStripeIdToUserId(userByEmail.id, stripeCustomerId)
      // Email and customer ID logging removed to prevent PII exposure
      return await findUserByStripeCustomerId(stripeCustomerId)
    }
  }

  // Customer ID and email logging removed to prevent PII exposure
  return null
}

/**
 * Update user access level by user ID
 */
async function updateUserAccessLevel(userId: string, accessLevel: string) {
  await setAccessLevelById(userId, accessLevel)
  // User ID logging removed to prevent sensitive identifier exposure
}

/**
 * Handle Stripe webhook events
 * Processes all webhook event types and updates user data accordingly
 * This contains all the business logic from the webhook route
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  // Webhook event type logging is safe (non-sensitive)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Session ID, customer ID, and email logging removed to prevent sensitive data exposure

        // Get full session data with line items to determine access level
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'customer']
        })

        // Use product IDs directly instead of fetching price IDs
        // Product IDs are stable, while price IDs can change over time
        const basicProductId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
        const premiumProductId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

        // Extract user update data from session using product IDs
        const updateData = extractUserUpdateData(
          {
            customer_id: fullSession.customer,
            customer_email: fullSession.customer_details?.email,
            line_items: fullSession.line_items?.data || []
          },
          basicProductId,
          premiumProductId
        )

        // Update user in database if we have a valid Stripe customer ID
        if (updateData.stripeCustomerId) {
          // Update data logging removed to prevent sensitive customer data exposure

          const user = await findUserByStripeId(updateData.stripeCustomerId, updateData.customerEmail)

          if (user) {
            await updateUserAccessLevel(user.id, updateData.accessLevel)
          } else {
            // Logging removed - error handling without exposing sensitive data
          }
        } else {
          // Update data logging removed to prevent sensitive customer data exposure
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Subscription ID logging removed to prevent sensitive identifier exposure

        // Only process active subscriptions for updates
        if (subscription.status === 'active' && subscription.customer) {
          // Subscription ID logging removed to prevent sensitive identifier exposure

          // Use product IDs directly - they are stable while price IDs can change
          const basicProductId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
          const premiumProductId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

          // Determine access level from subscription items using product IDs
          let accessLevel = 'free'
          for (const item of subscription.items.data) {
            const priceId = item.price.id
            // Extract product ID from price (can be string or object)
            const productId = typeof item.price.product === 'string' 
              ? item.price.product 
              : item.price.product?.id
            
            // Price ID and product ID logging removed to prevent sensitive identifier exposure

            if (productId === premiumProductId) {
              accessLevel = 'premium'
              break // Premium takes precedence
            } else if (productId === basicProductId) {
              accessLevel = 'basic'
            }
          }

          // Access level logging removed (non-sensitive but keeping logs minimal)

          // Find and update user
          const user = await findUserByStripeId(subscription.customer as string)

          if (user) {
            await updateUserAccessLevel(user.id, accessLevel)
            // Logging removed - operation completed successfully
          } else {
            // Customer ID logging removed to prevent sensitive identifier exposure
          }
        } else {
          // Status logging is safe (non-sensitive)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Invoice ID logging removed to prevent sensitive identifier exposure

        // If this is a subscription invoice, ensure access is granted immediately (especially after upgrade)
        const invAny = invoice as any
        if (invAny.subscription && invAny.customer) {
          const subscription = await stripe.subscriptions.retrieve(invAny.subscription as string, { expand: ['items'] })

          // Use product IDs directly - they are stable while price IDs can change
          const basicProductId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
          const premiumProductId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

          let accessLevel = 'free'
          for (const item of subscription.items.data) {
            const priceId = item.price.id
            // Extract product ID from price (can be string or object)
            const productId = typeof item.price.product === 'string' 
              ? item.price.product 
              : item.price.product?.id
            
            if (productId === premiumProductId) {
              accessLevel = 'premium'
              break
            } else if (productId === basicProductId) {
              accessLevel = 'basic'
            }
          }

          const user = await findUserByStripeId(invAny.customer as string)
          if (user) {
            await updateUserAccessLevel(user.id, accessLevel)
            // User email logging removed to prevent PII exposure
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Invoice ID logging removed to prevent sensitive identifier exposure
        // Keep prior access; optionally notify user via email in future
        break
      }

      case 'subscription_schedule.created':
      case 'subscription_schedule.updated':
      case 'subscription_schedule.canceled':
      case 'subscription_schedule.released': {
        const schedule = event.data.object as Stripe.SubscriptionSchedule
        // Schedule ID logging removed to prevent sensitive identifier exposure
        // Access level will flip on the subsequent customer.subscription.updated when phase changes
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Subscription ID logging removed to prevent sensitive identifier exposure

        // For subscription cancellations, downgrade user to free
        if (subscription.customer) {
          // Subscription ID logging removed to prevent sensitive identifier exposure

          const user = await findUserByStripeId(subscription.customer as string)

          if (user) {
            await updateUserAccessLevel(user.id, 'free')
            // Logging removed - operation completed successfully
          }
        }
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer

        // Customer ID, email, and name logging removed to prevent PII exposure

        // Only create user if we have an email and they don't already exist
        if (customer.email) {
          const existingUser = await getUserByEmail(customer.email)

          if (!existingUser) {
            // Sanitize customer name to prevent credit card numbers from being saved
            const sanitizedName = sanitizeCustomerName(customer.name)
            
            if (customer.name && !sanitizedName) {
              // Customer ID logging removed to prevent sensitive identifier exposure
              console.warn('Blocked invalid customer name during user creation - name failed validation (likely credit card number or invalid format)')
            }
            
            // Create new user with free access level (compatible with user API route)
            const newUser = await createUser({
              email: customer.email,
              name: sanitizedName || null,
              stripeCustomerId: customer.id,
              accessLevel: 'free'
            } as any)
            // User object logging removed to prevent PII exposure
          } else {
            // Link Stripe customer ID to existing user if not already linked
            if (!existingUser.stripeCustomerId) {
              await linkStripeIdToUserId(existingUser.id, customer.id)
              // User email logging removed to prevent PII exposure
            } else {
              // User email logging removed to prevent PII exposure
            }
          }
        } else {
          console.log('Customer created without email - skipping user creation')
        }
        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer

        // Customer ID, email, and name logging removed to prevent PII exposure

        // Find user by Stripe customer ID
        const user = await findUserByStripeId(customer.id, customer.email)

        if (user) {
          // Prepare update data - only update fields that have changed
          const updateData: any = {
            updatedAt: new Date()
          }

          // Sanitize and validate the customer name before updating
          // This prevents credit card numbers from being saved as names
          const sanitizedName = sanitizeCustomerName(customer.name)
          
          // Update name only if it's valid, different from current, and not a credit card number
          if (sanitizedName && sanitizedName !== user.name) {
            updateData.name = sanitizedName
          } else if (customer.name && !sanitizedName) {
            // Customer ID logging removed to prevent sensitive identifier exposure
            console.warn('Blocked invalid customer name update - name failed validation (likely credit card number or invalid format)')
          }

          // IMPORTANT: Do NOT update email automatically to prevent login issues
          // Users may sign up with one email but checkout with another
          // Only update email if the user's current email is null/empty (new user scenario)
          if (customer.email && customer.email !== user.email) {
            if (!user.email || user.email.trim() === '') {
              // Only update if user has no email set (shouldn't happen but safety check)
              updateData.email = customer.email
              // Email logging removed to prevent PII exposure
            } else {
              // Email mismatch logging removed to prevent PII exposure
            }
          }

          // Only update if there are actual changes
          if (Object.keys(updateData).length > 1) {
            // More than just updatedAt
            await updateUserById(user.id, updateData)
            // User email logging removed to prevent PII exposure
          } else {
            // User email logging removed to prevent PII exposure
          }
        } else {
          // Customer ID logging removed to prevent sensitive identifier exposure
        }
        break
      }

      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer

        // Customer ID and email logging removed to prevent PII exposure

        // Find user by Stripe customer ID
        const user = await findUserByStripeId(customer.id)

        if (user) {
          await updateUserById(user.id, { stripeCustomerId: null, accessLevel: 'free' })
          // User email logging removed to prevent PII exposure
        } else {
          // Customer ID logging removed to prevent sensitive identifier exposure
        }
        break
      }

      default:
        // Event type logging is safe (non-sensitive)
    }
  } catch (error) {
    console.error('Error processing webhook event:', error)
    throw error // Let the webhook route handle the error response
  }
}


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
import { extractUserUpdateData } from '@lib/stripe/stripe-utils'

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
 * Create a Stripe checkout session
 * Generates a session for embedded checkout flow
 * Requires authenticated user and valid product ID
 */
export async function createCheckoutSession(
  productId: string,
  userEmail: string
): Promise<ServiceResponse> {
  try {
    console.log('Creating checkout session for user:', userEmail)

    // Rate limiting check
    if (!checkRateLimit(userEmail)) {
      console.log('Rate limit exceeded for user:', userEmail)
      return {
        success: false,
        error: 'Too many requests. Please try again later.'
      }
    }

    console.log('Rate limit check passed')

    // Determine which Stripe price ID to use based on the product type
    let priceId: string | null = null

    if (productId === 'basic') {
      priceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC || null
    } else if (productId === 'premium') {
      priceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM || null
    } else {
      console.log('Invalid product ID:', productId)
    }

    // Validate that we have a valid price ID
    if (!priceId) {
      return {
        success: false,
        error: `Invalid product ID "${productId}" or missing Stripe configuration`
      }
    }

    // Create Stripe checkout session following their documentation pattern
    console.log('Creating Stripe session with price ID:', priceId)

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

    console.log('=== UPGRADE PREVIEW DEBUG ===')
    console.log('Subscription ID:', subscriptionId)
    console.log('Current price:', currentItem.price.id)
    console.log('New price:', newPriceId)
    console.log('Proration date:', prorationDate)
    console.log('Current period end:', (subscription as any).current_period_end)

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
    
    // Log detailed line item information for debugging
    console.log('=== UPCOMING INVOICE LINES ===')
    console.log('Total lines:', lines.length)
    lines.forEach((line: any, index: number) => {
      console.log(`Line ${index + 1}:`, {
        description: line.description,
        amount: line.amount,
        proration: line.proration,
        type: line.type,
        period: line.period ? `${new Date(line.period.start * 1000).toLocaleDateString()} - ${new Date(line.period.end * 1000).toLocaleDateString()}` : 'N/A',
        price: line.price?.id
      })
    })
    console.log('Invoice amount_due:', upcomingInvoice.amount_due)
    console.log('Invoice amount_remaining:', upcomingInvoice.amount_remaining)
    console.log('Invoice subtotal:', upcomingInvoice.subtotal)
    console.log('Invoice total:', upcomingInvoice.total)
    console.log('=== END PREVIEW DEBUG ===')

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
        console.log(`✓ Including in immediate charge - ${line.description}: ${amount} cents`)
        immediateCharge += amount
      } else {
        console.log(`✗ Excluding (future period) - ${line.description}: ${line.amount ?? 0} cents`)
      }
    })

    console.log('Calculated immediate proration charge:', immediateCharge, 'cents')
    console.log('That is:', (immediateCharge / 100).toFixed(2), upcomingInvoice.currency?.toUpperCase() || 'USD')

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

    // Log comprehensive session data for debugging
    console.log('=== STRIPE SESSION RETRIEVAL ===')
    console.log('Session ID:', sessionId)
    console.log('Session status:', session.status)
    console.log('Payment status:', session.payment_status)
    console.log('Customer ID:', session.customer)
    console.log('=== END STRIPE SESSION ===')

    // Prepare the response data
    const responseData = {
      // Basic status info
      status: session.status,
      payment_status: session.payment_status,

      // Customer information
      customer_email: session.customer_details?.email || null,
      customer_name: session.customer_details?.name || null,
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

    console.log('Starting unsubscribe process for user:', userEmail)
    console.log('Stripe customer ID:', stripeCustomerId)

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active'
    })

    console.log('Found active subscriptions:', subscriptions.data.length)

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
        console.log('Subscription marked for cancellation:', cancelled.id)
      } catch (error) {
        console.error('Error cancelling subscription:', subscription.id, error)
        // Continue with other subscriptions even if one fails
      }
    }

    // If no subscriptions were found or cancelled, still update user to free
    if (cancelledSubscriptions.length === 0) {
      console.log('No active subscriptions found, updating user to free plan')
    }

    // Update user's access level to free in database
    // Note: The webhook will also handle this when the subscription actually ends
    // But we update it here for immediate UI feedback
    const updatedUser = await updateUserById(user.id, { accessLevel: 'free' })

    console.log('User updated to free plan:', updatedUser.email)

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
    console.log('User found by Stripe ID:', stripeCustomerId)
    return user
  }

  // Fallback: try to find by email and link the Stripe ID
  if (email) {
    const userByEmail = await getUserByEmail(email)

    if (userByEmail) {
      // Link Stripe ID to existing user
      await linkStripeIdToUserId(userByEmail.id, stripeCustomerId)
      console.log('User found by email and linked Stripe ID:', email)
      return await findUserByStripeCustomerId(stripeCustomerId)
    }
  }

  console.log('No user found with Stripe ID or email:', { stripeCustomerId, email })
  return null
}

/**
 * Update user access level by user ID
 */
async function updateUserAccessLevel(userId: string, accessLevel: string) {
  await setAccessLevelById(userId, accessLevel)
  console.log(`User access level updated to: ${accessLevel}`)
}

/**
 * Handle Stripe webhook events
 * Processes all webhook event types and updates user data accordingly
 * This contains all the business logic from the webhook route
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log('Processing Stripe webhook:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout session completed:', session.id)
        console.log('Customer ID:', session.customer)
        console.log('Customer email:', session.customer_details?.email)

        // Get full session data with line items to determine access level
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'customer']
        })

        // Get Stripe price IDs from environment variables
        const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
        const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

        // Extract user update data from session
        const updateData = extractUserUpdateData(
          {
            customer_id: fullSession.customer,
            customer_email: fullSession.customer_details?.email,
            line_items: fullSession.line_items?.data || []
          },
          basicPriceId,
          premiumPriceId
        )

        // Update user in database if we have a valid Stripe customer ID
        if (updateData.stripeCustomerId) {
          console.log('Processing checkout completion:', updateData)

          const user = await findUserByStripeId(updateData.stripeCustomerId, updateData.customerEmail)

          if (user) {
            await updateUserAccessLevel(user.id, updateData.accessLevel)
          } else {
            console.log('Unable to find or create user for checkout completion')
          }
        } else {
          console.log('Missing Stripe customer ID for user update:', updateData)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status)

        // Only process active subscriptions for updates
        if (subscription.status === 'active' && subscription.customer) {
          console.log('Processing subscription update:', subscription.id)

          // Get Stripe price IDs from environment variables
          const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
          const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

          // Determine access level from subscription items
          let accessLevel = 'free'
          for (const item of subscription.items.data) {
            const priceId = item.price.id
            console.log('Subscription item price ID:', priceId)

            if (priceId === premiumPriceId) {
              accessLevel = 'premium'
              break // Premium takes precedence
            } else if (priceId === basicPriceId) {
              accessLevel = 'basic'
            }
          }

          console.log('Determined access level:', accessLevel)

          // Find and update user
          const user = await findUserByStripeId(subscription.customer as string)

          if (user) {
            await updateUserAccessLevel(user.id, accessLevel)
            console.log('User access level updated due to subscription change')
          } else {
            console.log('User not found for subscription update:', subscription.customer)
          }
        } else {
          console.log('Skipping inactive subscription update:', subscription.status)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment succeeded:', invoice.id)

        // If this is a subscription invoice, ensure access is granted immediately (especially after upgrade)
        const invAny = invoice as any
        if (invAny.subscription && invAny.customer) {
          const subscription = await stripe.subscriptions.retrieve(invAny.subscription as string, { expand: ['items'] })

          const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
          const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM

          let accessLevel = 'free'
          for (const item of subscription.items.data) {
            const priceId = item.price.id
            if (priceId === premiumPriceId) {
              accessLevel = 'premium'
              break
            } else if (priceId === basicPriceId) {
              accessLevel = 'basic'
            }
          }

          const user = await findUserByStripeId(invAny.customer as string)
          if (user) {
            await updateUserAccessLevel(user.id, accessLevel)
            console.log('User access updated on payment success:', user.email, accessLevel)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)
        // Keep prior access; optionally notify user via email in future
        break
      }

      case 'subscription_schedule.created':
      case 'subscription_schedule.updated':
      case 'subscription_schedule.canceled':
      case 'subscription_schedule.released': {
        const schedule = event.data.object as Stripe.SubscriptionSchedule
        console.log('Subscription schedule event:', event.type, schedule.id)
        // Access level will flip on the subsequent customer.subscription.updated when phase changes
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription deleted:', subscription.id)

        // For subscription cancellations, downgrade user to free
        if (subscription.customer) {
          console.log('Processing subscription cancellation:', subscription.id)

          const user = await findUserByStripeId(subscription.customer as string)

          if (user) {
            await updateUserAccessLevel(user.id, 'free')
            console.log('User downgraded to free due to subscription cancellation')
          }
        }
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer

        console.log('Customer created:', customer.id)
        console.log('Customer email:', customer.email)
        console.log('Customer name:', customer.name)

        // Only create user if we have an email and they don't already exist
        if (customer.email) {
          const existingUser = await getUserByEmail(customer.email)

          if (!existingUser) {
            // Create new user with free access level (compatible with user API route)
            const newUser = await createUser({
              email: customer.email,
              name: customer.name || null,
              stripeCustomerId: customer.id,
              accessLevel: 'free'
            } as any)
            console.log('New user created from Stripe customer:', newUser)
          } else {
            // Link Stripe customer ID to existing user if not already linked
            if (!existingUser.stripeCustomerId) {
              await linkStripeIdToUserId(existingUser.id, customer.id)
              console.log('Linked Stripe customer ID to existing user:', existingUser.email)
            } else {
              console.log('User already exists with Stripe customer ID:', existingUser.email)
            }
          }
        } else {
          console.log('Customer created without email - skipping user creation')
        }
        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer

        console.log('Customer updated:', customer.id)
        console.log('Customer email:', customer.email)
        console.log('Customer name:', customer.name)

        // Find user by Stripe customer ID
        const user = await findUserByStripeId(customer.id, customer.email)

        if (user) {
          // Prepare update data - only update fields that have changed
          const updateData: any = {
            updatedAt: new Date()
          }

          // Update name if it's different and provided
          if (customer.name && customer.name !== user.name) {
            updateData.name = customer.name
          }

          // IMPORTANT: Do NOT update email automatically to prevent login issues
          // Users may sign up with one email but checkout with another
          // Only update email if the user's current email is null/empty (new user scenario)
          if (customer.email && customer.email !== user.email) {
            if (!user.email || user.email.trim() === '') {
              // Only update if user has no email set (shouldn't happen but safety check)
              updateData.email = customer.email
              console.log('Updating empty user email with customer email:', customer.email)
            } else {
              // Log the difference but don't update to preserve login capability
              console.log('Email mismatch detected - preserving user login email:', {
                userEmail: user.email,
                customerEmail: customer.email,
                message: 'User may have used different email for checkout'
              })
            }
          }

          // Only update if there are actual changes
          if (Object.keys(updateData).length > 1) {
            // More than just updatedAt
            await updateUserById(user.id, updateData)
            console.log('User updated from Stripe customer changes:', user.email)
          } else {
            console.log('No meaningful changes to update for user:', user.email)
          }
        } else {
          console.log('User not found for customer update:', customer.id)
        }
        break
      }

      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer

        console.log('Customer deleted:', customer.id)
        console.log('Customer email:', customer.email)

        // Find user by Stripe customer ID
        const user = await findUserByStripeId(customer.id)

        if (user) {
          await updateUserById(user.id, { stripeCustomerId: null, accessLevel: 'free' })
          console.log('User Stripe association removed and downgraded:', user.email)
        } else {
          console.log('User not found for customer deletion:', customer.id)
        }
        break
      }

      default:
        console.log('Unhandled webhook event type:', event.type)
    }
  } catch (error) {
    console.error('Error processing webhook event:', error)
    throw error // Let the webhook route handle the error response
  }
}


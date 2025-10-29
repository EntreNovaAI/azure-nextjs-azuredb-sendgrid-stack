// Stripe Webhooks Route
// Handles incoming webhook events from Stripe
// Keeps only webhook verification and HTTP handling
// Business logic delegated to stripe-service

import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { handleStripeWebhookEvent } from "@lib/stripe/stripe-service"

export const runtime = "nodejs"

/**
 * Stripe Webhook Handler
 * Verifies webhook signature and delegates event processing to service layer
 * This endpoint must remain as an API route for Stripe to POST to
 */
export async function POST(req: NextRequest) {
  // Initialize Stripe for webhook verification
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" })
  
  // Get signature from headers
  const sig = req.headers.get("stripe-signature")!
  
  // Get raw body for signature verification
  const body = await req.text()
  
  // Verify webhook signature and construct event
  // This throws an error if signature is invalid
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  console.log('Stripe webhook received:', event.type)

  try {
    // Delegate all business logic to the service layer
    await handleStripeWebhookEvent(event)
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Return 200 to acknowledge receipt even if processing failed
    // Stripe will retry failed webhooks automatically
  }
  
  return NextResponse.json({ received: true })
}

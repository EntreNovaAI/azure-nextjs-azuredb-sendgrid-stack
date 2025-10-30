'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent, Button } from '@components/ui'
import { StripeCheckout } from '@/app/checkout/components'
import { getSessionStatusAction } from '@lib/stripe/stripe-actions'
import { updateUserAction } from '@lib/user/user-actions'
// Define types for session status response
interface SessionStatus {
  // Basic status info
  status: string
  payment_status: string
  
  // Customer information
  customer_email: string | null
  customer_name: string | null
  customer_id: string | null
  
  // Subscription information
  subscription_id: string | null
  
  // Payment information
  amount_total: number | null
  currency: string | null
  
  // Product information
  line_items: any[]
  
  // Metadata and timestamps
  created: number
  expires_at: number | null
  metadata: Record<string, any>
  
  // Debug info (remove in production)
  _debug_full_session?: any
}

/**
 * Updates user profile with new access level and Stripe customer ID
 * Called after successful payment to upgrade user's subscription
 * Now passes raw Stripe session data to server for processing
 */
async function updateUserProfile(sessionData: SessionStatus) {
  console.log('Updating user profile with Stripe session data:', sessionData)
  
  try {
    // Use Server Action instead of axios
    const result = await updateUserAction({
      stripeSessionData: sessionData // Pass raw session data to server for processing
    })
    
    if (result.success) {
      console.log('User profile updated successfully:', result.data)
      return result.data
    } else {
      throw new Error(`Failed to update user profile: ${result.error}`)
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * Checkout Return Page Component (Inner component)
 * Handles the return flow from Stripe checkout using query parameters
 * Follows Stripe's recommended pattern from their documentation:
 * https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=embedded-form
 */
function CheckoutReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const session_id = searchParams.get('session_id')

  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch session status when component mounts
    const fetchSessionStatus = async () => {
      if (!session_id) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Use Server Action to get session status
        const result = await getSessionStatusAction(session_id)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to retrieve session status')
        }
        
        const data = result.data
        
        // Comprehensive logging for database update planning
        console.log('=== STRIPE SESSION STATUS DATA ===')
        console.log('Full session data:', data)
        console.log('Session ID:', session_id)
        console.log('Session Status:', data.status)
        console.log('Payment Status:', data.payment_status)
        console.log('Customer Email:', data.customer_email)
        console.log('All available properties:', Object.keys(data))
        console.log('Raw data structure:', JSON.stringify(data, null, 2))
        console.log('=== END SESSION DATA ===')
        
        // Check if payment is complete and update database
        if (data.status === 'complete' && data.payment_status === 'paid') {
          console.log('Payment completed! Updating user profile...')
          console.log('Available data for DB update:')
          console.log('- Customer Email:', data.customer_email)
          console.log('- Customer Name:', data.customer_name)
          console.log('- Subscription ID:', data.subscription_id)
          console.log('- Customer ID:', data.customer_id)
          console.log('- Amount:', data.amount_total)
          console.log('- Currency:', data.currency)
          console.log('- Line Items:', data.line_items)
          
          // Update user profile with new access level and Stripe customer ID
          try {
            await updateUserProfile(data)
          } catch (updateError) {
            console.error('Failed to update user profile:', updateError)
            // Don't throw error here - payment was successful, just log the issue
          }
        }
        
        setSessionStatus(data)
        
      } catch (err) {
        console.error('Error fetching session status:', err)
        setError('Failed to load checkout status')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionStatus()
  }, [session_id])

  // Show loading state - uses brand colors
  if (loading) {
    return (
      <MainLayout>
        <div className="text-center max-w-md mx-auto py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Loading checkout status...</h1>
          <p className="text-muted-foreground">Please wait while we verify your payment.</p>
        </div>
      </MainLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <div className="text-center max-w-md mx-auto py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    )
  }

  // Handle different session statuses as per Stripe documentation
  if (sessionStatus?.status === 'open') {
    // Session is still open - remount embedded checkout
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Complete Your Purchase</h1>
            <p className="text-muted-foreground">Your checkout session is still active. Please complete your payment below.</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <StripeCheckout />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  } 
  
  if (sessionStatus?.status === 'complete') {
    // Payment successful - show success page using brand colors
    return (
      <MainLayout>
        <div className="text-center max-w-md mx-auto py-12">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-6 bg-brand-secondary/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your subscription is now active and you'll receive a confirmation email shortly.
            </p>
          </div>

          {/* Show payment details if available */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 text-center">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{sessionStatus.payment_status}</span>
                </div>
                {sessionStatus.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{sessionStatus.customer_email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              View Dashboard
            </Button>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Handle other statuses (expired, etc.)
  return (
    <MainLayout>
      <div className="text-center max-w-md mx-auto py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-4">Checkout Status</h1>
        <Card className="mb-4">
          <CardContent className="pt-6 space-y-2 text-left">
            <p><strong>Session Status:</strong> {sessionStatus?.status || 'Unknown'}</p>
            <p><strong>Payment Status:</strong> {sessionStatus?.payment_status || 'Unknown'}</p>
          </CardContent>
        </Card>
        <Button onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </MainLayout>
  )
}

// Main page component with Suspense boundary
export default function CheckoutReturn() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="text-center max-w-md mx-auto py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Loading checkout status...</h1>
          <p className="text-muted-foreground">Please wait while we verify your payment.</p>
        </div>
      </MainLayout>
    }>
      <CheckoutReturnContent />
    </Suspense>
  )
}

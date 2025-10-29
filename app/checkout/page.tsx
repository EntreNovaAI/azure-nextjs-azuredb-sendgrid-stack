'use client'

import { useSession } from 'next-auth/react'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent } from '@components/ui'
import { StripeCheckout } from '@/app/checkout/components'

/**
 * Checkout Page Component
 * Displays the Stripe embedded checkout form
 * Follows Stripe's recommended patterns for embedded checkout
 * Uses MainLayout for consistent structure
 */
export default function CheckoutPage() {
  const { data: session } = useSession()

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Complete Your Purchase</h1>
          <p className="text-muted-foreground pb-8">
            Secure checkout powered by Stripe. Your payment information is encrypted and secure.
          </p>
        </div>
        
        {/* Stripe Embedded Checkout Form */}
        <Card>
          <CardContent className="pt-6">
            <StripeCheckout />
          </CardContent>
        </Card>
        
        {/* Security notice */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>🔒 Your payment is secured with Stripe</p>
        </div>
      </div>
    </MainLayout>
  )
}

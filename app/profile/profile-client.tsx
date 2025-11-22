'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Separator } from '@components/ui'
import { cancelSubscriptionAction, createBillingPortalAction } from '@lib/stripe/stripe-actions'
import { formatAccessLevel } from '@constants/products'

// User type definition for the profile page
interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  accessLevel: string
  stripeCustomerId: string | null
  createdAt: Date
  updatedAt: Date
}

interface ProfileClientProps {
  user: User
}

/**
 * Profile Client Component
 * Handles user profile display and subscription management
 * Includes unsubscribe functionality for paid users
 * Uses centralized formatAccessLevel utility from constants
 */
export function ProfileClient({ user }: ProfileClientProps) {
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<string | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const router = useRouter()

  // Handle payment method update via Stripe Billing Portal
  // Opens the Stripe-hosted portal for customers to manage payment methods
  const handleUpdatePaymentMethod = async () => {
    if (!user.stripeCustomerId) {
      alert('No Stripe customer found for this account.')
      return
    }

    try {
      setIsPortalLoading(true)
      const res = await createBillingPortalAction()
      
      if (!res.success || !res.data?.url) {
        // Show detailed error message to help with troubleshooting
        const errorMsg = res.error || 'Failed to open billing portal'
        console.error('Billing portal error:', errorMsg)
        alert(errorMsg)
        return
      }
      
      // Open the Stripe billing portal in a new tab
      window.open(res.data.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Error opening billing portal:', err)
      alert('An error occurred opening the billing portal. Please try again or contact support.')
    } finally {
      setIsPortalLoading(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Handle unsubscribe functionality with downgrade option
  const handleUnsubscribe = async () => {
    if (!user.stripeCustomerId || user.accessLevel === 'free') {
      setUnsubscribeStatus('You are currently on the free plan.')
      return
    }

    // Step 1: Offer downgrade option for Premium users
    if (user.accessLevel === 'premium') {
      const downgradeOption = window.confirm(
        '💡 Would you like to downgrade to our Basic plan instead of canceling completely?\n\n' +
        '✓ Basic Plan keeps core features at a lower price\n' +
        '✗ Canceling moves you to the Free plan\n\n' +
        'Click "OK" to downgrade to Basic, or "Cancel" to proceed with full cancellation.'
      )

      if (downgradeOption) {
        // User chose to downgrade to Basic
        // Use window.location.href instead of router.push to preserve hash fragment
        // Next.js router.push() strips hash anchors, preventing scroll-to-section behavior
        setUnsubscribeStatus('Redirecting you to downgrade options...')
        window.location.href = '/dashboard#upgrade-section'
        return
      }
    }

    // Step 2: Confirm cancellation
    const planName = user.accessLevel === 'premium' ? 'Premium' : 'Basic'
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to cancel your ${planName} subscription?\n\n` +
      'Your subscription will remain active until the end of your current billing period.\n' +
      'After that, you will be moved to the Free plan.\n\n' +
      'Click "OK" to confirm cancellation.'
    )

    if (!confirmed) {
      return
    }

    setIsUnsubscribing(true)
    setUnsubscribeStatus(null)

    try {
      // Call the unsubscribe Server Action
      const result = await cancelSubscriptionAction(user.stripeCustomerId)

      if (result.success) {
        const endDate = result.data?.note || 'the end of your current billing period'
        setUnsubscribeStatus(
          `✓ Subscription canceled successfully!\n\n` +
          `Your ${planName} plan will remain active until ${endDate}. ` +
          `After that, you'll be moved to the Free plan. You can resubscribe anytime from the dashboard.`
        )
        // Refresh the page to show updated user data
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setUnsubscribeStatus('✗ ' + (result.error || 'Failed to cancel subscription. Please try again.'))
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      setUnsubscribeStatus('✗ An error occurred while canceling your subscription. Please try again.')
    } finally {
      setIsUnsubscribing(false)
    }
  }

  // Get plan status color for styling
  const getPlanStatusColor = (level: string) => {
    switch (level) {
      case 'free':
        return 'text-gray-600'
      case 'basic':
        return 'text-blue-600'
      case 'premium':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <MainLayout navbarOverlay={false}>
      <div className="max-w-[800px] mx-auto py-4 px-4 sm:py-8 sm:px-6">
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account information and subscription</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* User Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
                {/* Profile Image */}
                {user.image && (
                  <div className="shrink-0">
                    <img src={user.image} alt="Profile" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-border" />
                  </div>
                )}
                
                {/* User Details */}
                <div className="flex-1 w-full space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-1 sm:gap-0">
                    <label className="font-semibold text-sm sm:text-base">Name:</label>
                    <span className="text-sm sm:text-base text-muted-foreground break-words">{user.name || 'Not provided'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-1 sm:gap-0">
                    <label className="font-semibold text-sm sm:text-base">Email:</label>
                    <span className="text-sm sm:text-base text-muted-foreground break-all">{user.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1 sm:gap-0">
                    <label className="font-semibold text-sm sm:text-base">Member Since:</label>
                    <span className="text-sm sm:text-base text-muted-foreground">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b gap-1 sm:gap-0">
                  <label className="font-semibold text-sm sm:text-base">Current Plan:</label>
                  <span className={`text-sm sm:text-base font-semibold capitalize ${getPlanStatusColor(user.accessLevel)}`}>
                    {formatAccessLevel(user.accessLevel)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1 sm:gap-0">
                  <label className="font-semibold text-sm sm:text-base">Last Updated:</label>
                  <span className="text-sm sm:text-base text-muted-foreground">{formatDate(user.updatedAt)}</span>
                </div>
              </div>

              {/* Manage Subscription Section */}
              {user.accessLevel !== 'free' && user.stripeCustomerId && (
                <div className="pt-4 sm:pt-6 border-t">
                  <h3 className="font-semibold text-base sm:text-lg mb-2">Manage Subscription</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    You are currently subscribed to the {formatAccessLevel(user.accessLevel)}. 
                    You can update your payment method or cancel your subscription below.
                    {user.accessLevel === 'premium' && ' We also offer a more affordable Basic plan option.'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button 
                      onClick={handleUpdatePaymentMethod}
                      disabled={isPortalLoading}
                      variant="outline"
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      {isPortalLoading ? 'Opening Portal...' : 'Update Payment Method'}
                    </Button>

                    <Button 
                      onClick={handleUnsubscribe}
                      disabled={isUnsubscribing}
                      variant="destructive"
                      className="w-full sm:w-auto text-sm sm:text-base"
                    >
                      {isUnsubscribing ? 'Processing...' : 'Cancel Subscription'}
                    </Button>
                  </div>
                  
                  {unsubscribeStatus && (
                    <div className={`mt-4 p-3 sm:p-4 rounded text-xs sm:text-sm whitespace-pre-line ${
                      unsubscribeStatus.includes('✓') || unsubscribeStatus.includes('Redirect') 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      {unsubscribeStatus}
                    </div>
                  )}
                </div>
              )}

              {/* Free Plan Message */}
              {user.accessLevel === 'free' && (
                <div className="pt-4 sm:pt-6 border-t">
                  <h3 className="font-semibold text-base sm:text-lg mb-2">Free Plan</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    You are currently on the free plan. {' '}
                    <Link href="/landing-page" className="text-primary font-semibold hover:underline">
                      Upgrade to a paid plan
                    </Link> {' '}
                    to access premium features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

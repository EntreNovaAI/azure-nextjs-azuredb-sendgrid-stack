'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Separator } from '@components/ui'
import { cancelSubscriptionAction } from '@lib/stripe/stripe-actions'

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
 */
export function ProfileClient({ user }: ProfileClientProps) {
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [unsubscribeStatus, setUnsubscribeStatus] = useState<string | null>(null)
  const router = useRouter()

  // Format the access level for display
  const formatAccessLevel = (level: string) => {
    switch (level) {
      case 'free':
        return 'Free Plan'
      case 'basic':
        return 'Basic Plan'
      case 'premium':
        return 'Premium Plan'
      default:
        return 'Unknown Plan'
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

  // Handle unsubscribe functionality
  const handleUnsubscribe = async () => {
    if (!user.stripeCustomerId || user.accessLevel === 'free') {
      setUnsubscribeStatus('You are currently on the free plan.')
      return
    }

    // Confirm the user wants to unsubscribe
    const confirmed = window.confirm(
      'Are you sure you want to unsubscribe? This will cancel your subscription and downgrade you to the free plan.'
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
        setUnsubscribeStatus(result.data?.message || 'Successfully unsubscribed! Your subscription will end at the end of the current billing period.')
        // Refresh the page to show updated user data
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setUnsubscribeStatus(result.error || 'Failed to unsubscribe. Please try again.')
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      setUnsubscribeStatus('An error occurred while unsubscribing. Please try again.')
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
    <MainLayout>
      <div className="max-w-[800px] mx-auto py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and subscription</p>
        </div>

        <div className="space-y-6">
          {/* User Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-8">
                {/* Profile Image */}
                {user.image && (
                  <div className="shrink-0">
                    <img src={user.image} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-border" />
                  </div>
                )}
                
                {/* User Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <label className="font-semibold min-w-[120px]">Name:</label>
                    <span className="text-muted-foreground">{user.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <label className="font-semibold min-w-[120px]">Email:</label>
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <label className="font-semibold min-w-[120px]">Member Since:</label>
                    <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b">
                  <label className="font-semibold min-w-[120px]">Current Plan:</label>
                  <span className={`font-semibold capitalize ${getPlanStatusColor(user.accessLevel)}`}>
                    {formatAccessLevel(user.accessLevel)}
                  </span>
                </div>
                {user.stripeCustomerId && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <label className="font-semibold min-w-[120px]">Customer ID:</label>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{user.stripeCustomerId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <label className="font-semibold min-w-[120px]">Last Updated:</label>
                  <span className="text-muted-foreground">{formatDate(user.updatedAt)}</span>
                </div>
              </div>

              {/* Unsubscribe Section */}
              {user.accessLevel !== 'free' && user.stripeCustomerId && (
                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-2">Manage Subscription</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You are currently subscribed to the {formatAccessLevel(user.accessLevel)}. 
                    If you wish to cancel your subscription, click the button below.
                  </p>
                  
                  <Button 
                    onClick={handleUnsubscribe}
                    disabled={isUnsubscribing}
                    variant="destructive"
                  >
                    {isUnsubscribing ? 'Processing...' : 'Unsubscribe'}
                  </Button>
                  
                  {unsubscribeStatus && (
                    <div className={`mt-4 p-4 rounded font-medium text-sm ${unsubscribeStatus.includes('Successfully') ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                      {unsubscribeStatus}
                    </div>
                  )}
                </div>
              )}

              {/* Free Plan Message */}
              {user.accessLevel === 'free' && (
                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-2">Free Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    You are currently on the free plan. {' '}
                    <Link href="/dashboard" className="text-primary font-semibold hover:underline">
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
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
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

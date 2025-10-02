'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import axios from 'axios'

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
      // Call the unsubscribe API endpoint using axios
      const response = await axios.post('/api/stripe/unsubscribe', {
        stripeCustomerId: user.stripeCustomerId
      })

      setUnsubscribeStatus('Successfully unsubscribed! Your subscription will end at the end of the current billing period.')
      // Refresh the page to show updated user data
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error unsubscribing:', error)
      if (axios.isAxiosError(error) && error.response) {
        setUnsubscribeStatus(error.response.data.error || 'Failed to unsubscribe. Please try again.')
      } else {
        setUnsubscribeStatus('An error occurred while unsubscribing. Please try again.')
      }
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
    <div className="max-w-[800px] mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-100 mb-2">My Profile</h1>
        <p className="text-slate-300">Manage your account information and subscription</p>
      </div>

      <div>
        {/* User Information Section */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 border-b-2 border-slate-100 pb-2">Account Information</h2>
          
          <div className="flex items-start gap-8">
            {/* Profile Image */}
            {user.image && (
              <div className="shrink-0">
                <img src={user.image} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-slate-200" />
              </div>
            )}
            
            {/* User Details */}
            <div className="flex-1">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <label className="font-semibold text-slate-800 min-w-[120px]">Name:</label>
                <span className="text-slate-600">{user.name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <label className="font-semibold text-slate-800 min-w-[120px]">Email:</label>
                <span className="text-slate-600">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <label className="font-semibold text-slate-800 min-w-[120px]">Member Since:</label>
                <span className="text-slate-600">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Subscription Details</h2>
          
          <div className="mb-6">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <label className="font-semibold text-slate-800 min-w-[120px]">Current Plan:</label>
              <span className={`font-semibold capitalize ${getPlanStatusColor(user.accessLevel)}`}>
                {formatAccessLevel(user.accessLevel)}
              </span>
            </div>
            {user.stripeCustomerId && (
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <label className="font-semibold text-slate-800 min-w-[120px]">Customer ID:</label>
                <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{user.stripeCustomerId}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <label className="font-semibold text-slate-800 min-w-[120px]">Last Updated:</label>
              <span className="text-slate-600">{formatDate(user.updatedAt)}</span>
            </div>
          </div>

          {/* Unsubscribe Section */}
          {user.accessLevel !== 'free' && user.stripeCustomerId && (
            <div className="pt-6 border-t border-slate-100">
              <h3>Manage Subscription</h3>
              <p>
                You are currently subscribed to the {formatAccessLevel(user.accessLevel)}. 
                If you wish to cancel your subscription, click the button below.
              </p>
              
              <button 
                onClick={handleUnsubscribe}
                disabled={isUnsubscribing}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isUnsubscribing ? 'Processing...' : 'Unsubscribe'}
              </button>
              
              {unsubscribeStatus && (
                <div className={`mt-4 p-4 rounded font-medium ${unsubscribeStatus.includes('Successfully') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                  {unsubscribeStatus}
                </div>
              )}
            </div>
          )}

          {/* Free Plan Message */}
          {user.accessLevel === 'free' && (
            <div className="pt-6 border-t border-slate-100">
              <h3>Free Plan</h3>
              <p>
                You are currently on the free plan. 
                <a href="/products" className="text-blue-600 font-semibold hover:underline">Upgrade to a paid plan</a> 
                to access premium features.
              </p>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Account Actions</h2>
          
          <div className="flex gap-4">
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

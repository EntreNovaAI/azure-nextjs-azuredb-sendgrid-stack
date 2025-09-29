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
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information and subscription</p>
      </div>

      <div className="profile-content">
        {/* User Information Section */}
        <div className="profile-section">
          <h2>Account Information</h2>
          
          <div className="profile-info">
            {/* Profile Image */}
            {user.image && (
              <div className="profile-image">
                <img 
                  src={user.image} 
                  alt="Profile" 
                  className="profile-avatar"
                />
              </div>
            )}
            
            {/* User Details */}
            <div className="profile-details">
              <div className="profile-field">
                <label>Name:</label>
                <span>{user.name || 'Not provided'}</span>
              </div>
              
              <div className="profile-field">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              
              <div className="profile-field">
                <label>Member Since:</label>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="profile-section">
          <h2>Subscription Details</h2>
          
          <div className="subscription-info">
            <div className="profile-field">
              <label>Current Plan:</label>
              <span className={`plan-status ${getPlanStatusColor(user.accessLevel)}`}>
                {formatAccessLevel(user.accessLevel)}
              </span>
            </div>
            
            {user.stripeCustomerId && (
              <div className="profile-field">
                <label>Customer ID:</label>
                <span className="customer-id">{user.stripeCustomerId}</span>
              </div>
            )}
            
            <div className="profile-field">
              <label>Last Updated:</label>
              <span>{formatDate(user.updatedAt)}</span>
            </div>
          </div>

          {/* Unsubscribe Section */}
          {user.accessLevel !== 'free' && user.stripeCustomerId && (
            <div className="unsubscribe-section">
              <h3>Manage Subscription</h3>
              <p>
                You are currently subscribed to the {formatAccessLevel(user.accessLevel)}. 
                If you wish to cancel your subscription, click the button below.
              </p>
              
              <button 
                onClick={handleUnsubscribe}
                disabled={isUnsubscribing}
                className="unsubscribe-button"
              >
                {isUnsubscribing ? 'Processing...' : 'Unsubscribe'}
              </button>
              
              {unsubscribeStatus && (
                <div className={`status-message ${unsubscribeStatus.includes('Successfully') ? 'success' : 'error'}`}>
                  {unsubscribeStatus}
                </div>
              )}
            </div>
          )}

          {/* Free Plan Message */}
          {user.accessLevel === 'free' && (
            <div className="free-plan-message">
              <h3>Free Plan</h3>
              <p>
                You are currently on the free plan. 
                <a href="/products" className="upgrade-link">Upgrade to a paid plan</a> 
                to access premium features.
              </p>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="profile-section">
          <h2>Account Actions</h2>
          
          <div className="account-actions">
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="sign-out-button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

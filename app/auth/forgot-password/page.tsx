// Forgot password page
// Allows users to request a password reset email

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const router = useRouter()

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email,
      })

      if (response.status === 200) {
        setSuccess(response.data.message || 'If an account with this email exists, a password reset email has been sent.')
        setEmailSent(true)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data
        setError(data.error || 'Failed to send password reset email')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle back to sign in
  const handleBackToSignIn = () => {
    router.push('/auth/signup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  isLoading || !email
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                } text-white`}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          ) : (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                {success}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <button
                  onClick={() => setEmailSent(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Try different email
                </button>
              </div>
            </div>
          )}

          {/* Back to sign in */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToSignIn}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

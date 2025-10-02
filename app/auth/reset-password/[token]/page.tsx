// Password reset page with token validation
// Allows users to set a new password using a valid reset token

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { validatePasswordStrength } from '@/app/_lib/auth/password-utils'
import { PasswordInput } from '@/app/_components/ui'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const router = useRouter()
  const params = useParams()
  const token = params?.token as string

  // Validate token on component mount
  useEffect(() => {
    if (token) {
      // Basic token validation (should be at least 10 characters)
      if (token.length < 10) {
        setIsValidToken(false)
        setError('Invalid reset token')
      } else {
        setIsValidToken(true)
      }
    } else {
      setIsValidToken(false)
      setError('Missing reset token')
    }
  }, [token])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '))
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        password,
      })

      if (response.status === 200) {
        setSuccess(response.data.message || 'Password has been successfully reset!')

        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          router.push('/auth/signup')
        }, 3000)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data
        setError(data.error || 'Failed to reset password')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle back to forgot password
  const handleBackToForgotPassword = () => {
    router.push('/auth/forgot-password')
  }

  // Show error state for invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <button
              onClick={handleBackToForgotPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password field with visibility toggle */}
            <PasswordInput
              id="password"
              label="New Password"
              value={password}
              onChange={setPassword}
              required
              showHint
            />

            {/* Confirm password field with visibility toggle */}
            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                isLoading || !password || !confirmPassword
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              } text-white`}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          {/* Back to forgot password */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToForgotPassword}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Forgot Password
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

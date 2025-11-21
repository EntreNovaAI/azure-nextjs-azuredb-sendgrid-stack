// Forgot password page
// Allows users to request a password reset email

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent, Button, Input, Label } from '@components/ui'
import { requestPasswordResetAction } from '@lib/auth/auth-actions'

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
      // Call Server Action to request password reset
      const result = await requestPasswordResetAction(email)

      if (result.success) {
        setSuccess(result.message || 'If an account with this email exists, a password reset email has been sent.')
        setEmailSent(true)
      } else {
        setError(result.error || 'Failed to send password reset email')
      }
    } catch (error) {
      console.error('Password reset request error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout showFooter={false}
    containerClass="flex min-h-[calc(100vh-6rem)] items-center justify-center">
      {/* Center the card vertically and horizontally while keeping navbar/footer */}
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </form>
            ) : (
              /* Success state - uses brand colors */
              <div className="space-y-4">
                <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/20 text-green-600 dark:text-green-400 rounded-md text-sm">
                  {success}
                </div>

                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>

                  <Button
                    variant="link"
                    onClick={() => setEmailSent(false)}
                    className="text-sm"
                  >
                    Try different email
                  </Button>
                </div>
              </div>
            )}

            {/* Back to sign in */}
            <div className="mt-6 text-center">
              <Link
                href="/auth/signup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

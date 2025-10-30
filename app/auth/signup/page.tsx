// Comprehensive sign-up page with authentication method selection
// Users can choose between email/password registration or Google OAuth
// Integrated with centralized color system for consistent branding

'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { AuthLayout } from '@/src/layouts'
import { PasswordInput, Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Separator } from '@components/ui'
import { registerUserAction } from '@lib/auth/auth-actions'
import { getColors } from '@constants/colors'

// Component that uses useSearchParams - must be wrapped in Suspense
function SignUpContent() {
  // State management for form and UI
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'google' | null>(null)
  const [isLogin, setIsLogin] = useState(false) // Toggle between signup and login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Router and theme hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const { resolvedTheme } = useTheme()
  
  // Get colors based on current theme for consistent branding
  const colors = getColors(resolvedTheme === 'dark')

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl })
  }

  // Handle email/password form submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // Handle login with NextAuth credentials provider
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid email or password')
        } else if (result?.ok) {
          setSuccess('Login successful! Redirecting...')
          setTimeout(() => {
            router.push(callbackUrl)
          }, 1000)
        }
      } else {
        // Handle registration via Server Action
        const result = await registerUserAction(email, password, name || undefined)

        if (result.success) {
          setSuccess('Registration successful! You can now login.')
          setIsLogin(true)
          setPassword('')
        } else {
          // Handle error response
          if (result.details && Array.isArray(result.details)) {
            setError(result.details.join(', '))
          } else {
            setError(result.error || 'Registration failed')
          }
        }
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout showBackLink={false}>
      <div className="space-y-6">
        {/* Header - uses brand primary color for emphasis */}
        <div className="text-center">
          <h1 
            className="text-3xl font-bold" 
            style={{ color: colors.primary }}
          >
            Welcome!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose how you'd like to get started
          </p>
        </div>

        {!selectedMethod ? (
          /* Method Selection */
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Sign Up or Sign In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google OAuth Option - uses shadcn Button with brand colors on hover */}
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full transition-all duration-200"
                size="lg"
                style={{
                  // Apply subtle brand color on hover
                  ['--hover-bg' as string]: `${colors.primary}10`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.primary}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email Option - primary shadcn Button styled with brand colors */}
              <Button
                onClick={() => setSelectedMethod('email')}
                className="w-full"
                size="lg"
                style={{
                  backgroundColor: colors.primary,
                  color: resolvedTheme === 'dark' ? colors.text : '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Continue with Email
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Email Form */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMethod(null)}
                  aria-label="Go back to method selection"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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

                {/* Name field (only for registration) */}
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name (Optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      placeholder="Your Name"
                    />
                  </div>
                )}

                {/* Password field with visibility toggle */}
                <PasswordInput
                  id="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  required
                  showHint={!isLogin}
                />

                {/* Error message - uses brand accent color */}
                {error && (
                  <div 
                    className="p-3 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: `${colors.accent}15`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `${colors.accent}40`,
                      color: colors.accent
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Success message - uses brand secondary color */}
                {success && (
                  <div 
                    className="p-3 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: `${colors.secondary}15`,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `${colors.secondary}40`,
                      color: colors.secondary
                    }}
                  >
                    {success}
                  </div>
                )}

                {/* Submit button - styled with brand primary color */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    backgroundColor: isLoading ? `${colors.primary}70` : colors.primary,
                    color: resolvedTheme === 'dark' ? colors.text : '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.currentTarget.style.opacity = '1'
                  }}
                >
                  {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              {/* Forgot password link (only show on login) */}
              {isLogin && (
                <div className="mt-4 text-center">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}

              {/* Toggle between login and register */}
              <div className="mt-6 text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setSuccess('')
                    setPassword('')
                  }}
                  className="text-sm"
                >
                  {isLogin
                    ? "Don't have an account? Create one"
                    : 'Already have an account? Sign in'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to home link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

// Main page component with Suspense boundary
export default function SignUpPage() {
  return (
    <Suspense fallback={
      <AuthLayout showBackLink={false}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLayout>
    }>
      <SignUpContent />
    </Suspense>
  )
}

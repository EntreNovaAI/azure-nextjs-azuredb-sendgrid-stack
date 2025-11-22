'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import { MainLayout } from '@/src/layouts'
import { Card, CardContent } from '@components/ui'
import { LoadingState, AuthRequiredState, AccessNotice, ProductsGrid } from '@components/shared'
import { UserInfo } from '@components/auth'
import { Calculator } from '@/app/(product)/dashboard/components'
import { products } from '@constants/products'
import { getUserAction } from '@lib/user/user-actions'

/**
 * Protected Dashboard Page
 * Only accessible to authenticated users
 * Displays premium content and user access level
 * Dynamically fetches prices from Stripe for real-time accuracy
 */
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user details including access level when session is available
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserDetails()
    } else {
      setLoading(false)
    }
  }, [session])

  /**
   * Fetch user details including access level from database
   */
  const fetchUserDetails = async () => {
    try {
      // Use Server Action instead of axios
      const result = await getUserAction()
      if (result.success) {
        setUser(result.data)
      } else {
        console.error('Error fetching user details:', result.error)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return <LoadingState message="Please wait while we load your dashboard." />
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <AuthRequiredState message="Please sign in to access your dashboard." />
  }

  // Get access level for display
  const accessLevel = user?.accessLevel || 'free'
  const accessLevelDisplay = accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)
  
  // Filter products based on user's current access level
  // FREE users see all plans, BASIC users see BASIC and PREMIUM, PREMIUM users see only PREMIUM
  const filteredProducts = products.filter((product) => {
    if (accessLevel === 'free' || accessLevel === 'default') {
      return true // Show all products for free users
    } else if (accessLevel === 'basic') {
      return product.variant !== 'default' // Hide free plan for basic users
    } else if (accessLevel === 'premium') {
      return product.variant === 'premium' // Show only premium plan for premium users
    }
    return true
  })

  return (
    <MainLayout>
      <div className="py-8">
        {/* Access Level Banner */}
        <Card className={`mb-8 ${
          accessLevel === 'free' ? 'border-gray-200 dark:border-gray-800' :
          accessLevel === 'basic' ? 'border-amber-400' :
          'border-violet-500'
        }`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl mb-2">
                  {accessLevel === 'free' && '🆓 Free Version'}
                  {accessLevel === 'basic' && '⭐ Basic Version'}
                  {accessLevel === 'premium' && '🏢 Premium Version'}
                </h2>
                <p className="opacity-70 m-0">
                  {accessLevel === 'free' && 'You have access to basic calculator functions'}
                  {accessLevel === 'basic' && 'You have access to memory functions and calculation history'}
                  {accessLevel === 'premium' && 'You have access to all advanced calculator features'}
                </p>
              </div>
              {accessLevel !== 'premium' && (
                <div className="text-right">
                  <p className="m-0 text-sm opacity-70">Want more features?</p>
                  <a href="#upgrade-section" className="inline-block px-3 py-2 rounded font-semibold bg-accent text-accent-foreground hover:bg-accent/80 transition">
                    Upgrade Now →
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calculator Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2">Calculator Demo</h2>
            <p className="opacity-70">Try our calculator with features based on your current access level</p>
          </div>
          
          <Calculator accessLevel={accessLevel} />
        </div>

        {/* Products Section */}
        <div id="upgrade-section" className="mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Upgrade Your Plan</h2>
            <p className="opacity-70">Unlock more calculator features with our premium plans</p>
            
            {/* Display user information */}
            <UserInfo user={user} />
          </div>

          {/* Product Grid - filtered based on user's access level */}
          {/* Center cards when there are fewer than 3 */}
          <Suspense fallback={
            <div className={`grid gap-8 mb-12 ${
              filteredProducts.length === 1 
                ? 'grid-cols-1 max-w-md mx-auto' 
                : filteredProducts.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          }>
            <ProductsGrid 
              products={filteredProducts}
              userAccessLevel={accessLevel}
              gridClassName="grid gap-8 mb-12"
            />
          </Suspense>

          {/* Access Level Notice */}
          <AccessNotice accessLevel={accessLevel} />
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ProductCard, LoadingState, AuthRequiredState, AccessNotice } from '@/app/_components/ui'
import { UserInfo } from '@/app/_components/auth'
import { Calculator } from '@/app/_components/features'
import { products } from '@/app/_data/products'

/**
 * Protected Products Page
 * Only accessible to authenticated users
 * Displays premium content and user access level
 */
export default function ProductsPage() {
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
      const response = await axios.get('/api/user')
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return <LoadingState message="Please wait while we load your products." />
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <AuthRequiredState message="Please sign in to access our premium products." />
  }

  // Get access level for display
  const accessLevel = user?.accessLevel || 'free'
  const accessLevelDisplay = accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)

  return (
    // Tailwind migration: replaces `.page-container`
    <div className="max-w-[1200px] mx-auto px-4">
      {/* Access Level Banner */}
      <div className={`p-6 rounded-xl mb-8 border-2 ${
        accessLevel === 'free' ? 'bg-slate-100 border-slate-400 text-slate-600' :
        accessLevel === 'basic' ? 'bg-amber-100 border-amber-400 text-amber-900' :
        'bg-violet-100 border-violet-500 text-violet-900'
      }`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl mb-2">
              {accessLevel === 'free' && '🆓 Free Version'}
              {accessLevel === 'basic' && '⭐ Basic Version'}
              {accessLevel === 'premium' && '🏢 Premium Version'}
            </h2>
            <p className="opacity-80 m-0">
              {accessLevel === 'free' && 'You have access to basic calculator functions'}
              {accessLevel === 'basic' && 'You have access to memory functions and calculation history'}
              {accessLevel === 'premium' && 'You have access to all advanced calculator features'}
            </p>
          </div>
          {accessLevel !== 'premium' && (
            <div className="text-right">
              <p className="m-0 text-sm">Want more features?</p>
              <a href="#upgrade-section" className="inline-block px-3 py-2 rounded font-semibold bg-white/20 hover:bg-white/30 transition">
                Upgrade Now →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Calculator Section */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl mb-2 text-slate-800">Calculator Demo</h2>
          <p className="text-slate-600">Try our calculator with features based on your current access level</p>
        </div>
        
        <Calculator accessLevel={accessLevel} />
      </div>

      {/* Products Section */}
      <div id="upgrade-section" className="mb-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Upgrade Your Plan</h2>
          <p className="text-slate-600">Unlock more calculator features with our premium plans</p>
          
          {/* Display user information */}
          <UserInfo user={user} />
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8 mb-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              description={product.description}
              features={product.features}
              price={product.price}
              variant={product.variant}
              productId={product.id}
            />
          ))}
        </div>

        {/* Access Level Notice */}
        <AccessNotice accessLevel={accessLevel} />
      </div>
    </div>
  )
}

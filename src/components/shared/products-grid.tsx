/**
 * Products Grid Component
 * Reusable component that handles dynamic price fetching and product card rendering
 * Includes loading states and responsive grid layouts
 * Single source of truth for product grid rendering across the app
 */

import { ProductCard } from '@components/cards'
import { useProductPrices } from '@/src/hooks/useProductPrices'
import type { Product } from '@constants/products'

interface ProductsGridProps {
  /** Array of products to display */
  products: Product[]
  /** Current user's access level (optional, for conditional rendering) */
  userAccessLevel?: string
  /** Custom grid layout class (optional) */
  gridClassName?: string
}

/**
 * ProductsGrid Component
 * Fetches prices from Stripe and renders product cards with loading state
 * Automatically adjusts grid layout based on number of products
 */
export function ProductsGrid({ 
  products, 
  userAccessLevel, 
  gridClassName 
}: ProductsGridProps) {
  const { prices, loading } = useProductPrices()
  
  // Determine grid layout based on number of products
  // 1 product: single column, centered
  // 2 products: 2 columns on medium screens
  // 3+ products: standard 3-column grid
  const defaultGridClass = `grid gap-8 ${
    products.length === 1 
      ? 'grid-cols-1 max-w-md mx-auto' 
      : products.length === 2 
      ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' 
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }`
  
  const gridClass = gridClassName || defaultGridClass
  
  // Show loading skeleton while prices are being fetched from Stripe
  if (loading) {
    return (
      <div className={gridClass}>
        {products.map((product) => (
          <div 
            key={product.id} 
            className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
            aria-label={`Loading ${product.title}`}
          />
        ))}
      </div>
    )
  }
  
  // Render product cards with fetched prices from Stripe
  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          price={prices[product.id]}
          userAccessLevel={userAccessLevel}
        />
      ))}
    </div>
  )
}




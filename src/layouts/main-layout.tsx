import { ReactNode } from 'react'
import { Navbar } from './navbar'
import { Footer } from './footer'

interface MainLayoutProps {
  children: ReactNode
  /** Optional: Show footer (default: true) */
  showFooter?: boolean
  /** Optional: Custom container max width class */
  containerClass?: string
}

/**
 * Main Layout Component
 * Standard page layout with navbar, content area, and footer
 * Provides consistent structure across main application pages
 * Can be customized with optional props
 */
export function MainLayout({ 
  children, 
  showFooter = true,
  containerClass = 'max-w-[1400px] mx-auto px-4'
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className={containerClass}>
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}


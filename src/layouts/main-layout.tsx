import { ReactNode } from 'react'
import { Footer } from '../components/footer/footer'
import { Navbar } from '@components/navbar'

interface MainLayoutProps {
  children: ReactNode
  /** Optional: Show footer (default: true) */
  showFooter?: boolean
  /** Optional: Custom container max width class */
  containerClass?: string
  /** Optional: When true, navbar overlays content (no padding). When false (default), navbar pushes content down with padding. */
  navbarOverlay?: boolean
}

/**
 * Main Layout Component
 * Standard page layout with navbar, content area, and footer
 * Provides consistent structure across main application pages
 * Can be customized with optional props
 * 
 * @param navbarOverlay - When true, navbar overlays content (absolute positioning).
 *                        When false (default), navbar pushes content down with padding.
 */
export function MainLayout({ 
  children, 
  showFooter = true,
  containerClass = 'max-w-[1400px] mx-auto px-4',
  navbarOverlay = false
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={`flex-1 ${navbarOverlay ? '' : 'pt-16'}`}>
        <div className={containerClass}>
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}


import { AuthProvider } from '@/app/_components/auth'
import { Navigation } from '@/app/_components/ui'
import './globals.css'

export const metadata = {
  title: 'Azure Next Stack - Auth Demo',
  description: 'Testing authentication with protected products and customer records',
}

/**
 * Root Layout Component
 * Wraps the entire application with auth provider and navigation
 * Provides consistent layout structure across all pages
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white antialiased">
        <AuthProvider>
          {/* Modern dark theme layout with gradient background */}
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

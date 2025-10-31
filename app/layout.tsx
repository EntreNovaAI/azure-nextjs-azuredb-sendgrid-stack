import { AuthProvider } from '@/app/auth/components'
import { RootLayout } from '@/src/layouts'
import '@src/styles/globals.css'

export const metadata = {
  title: 'Azure Next Stack - Auth Demo',
  description: 'Testing authentication with protected products and customer records',
  // Add icon/favicon configuration
  icons: {
    icon: '/icon.png',
  },
}

/**
 * Root Layout Component
 * Wraps the entire application with theme provider and auth provider
 * Provides consistent layout structure with dark mode support
 */
export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RootLayout>
      <AuthProvider>
        {children}
      </AuthProvider>
    </RootLayout>
  )
}

import { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Root Layout Component
 * Wraps the entire application with theme provider
 * Provides the HTML structure with theme support and hydration handling
 * Should be used in app/layout.tsx as the base wrapper
 */
export function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}


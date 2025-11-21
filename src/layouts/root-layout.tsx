import { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'


interface RootLayoutProps {
  children: ReactNode
}

/**
 * Root Layout Component
 * Wraps the entire application with theme provider and font configuration
 * Provides the HTML structure with theme support and hydration handling
 * Fonts are configured in src/constants/fonts.ts
 * Should be used in app/layout.tsx as the base wrapper
 */
export function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}


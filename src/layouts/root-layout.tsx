import { ReactNode } from 'react'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from './theme-provider'

// Load Google Fonts using Next.js font optimization
// Fonts are automatically optimized and self-hosted
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Root Layout Component
 * Wraps the entire application with theme provider and font configuration
 * Provides the HTML structure with theme support and hydration handling
 * Fonts are loaded via Next.js font optimization and configured in globals.css
 * Should be used in app/layout.tsx as the base wrapper
 */
export function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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


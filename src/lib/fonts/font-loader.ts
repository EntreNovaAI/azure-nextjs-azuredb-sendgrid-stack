/**
 * Font Loader
 * Loads Google Fonts using Next.js font optimization
 * Fonts are automatically applied throughout the app via CSS variables
 * 
 * To change a font:
 * 1. Update the import (e.g., change Inter to Roboto)
 * 2. Update the font loader call (e.g., change Inter() to Roboto())
 * 3. Update src/constants/fonts.ts to document the change
 * 4. Restart your dev server
 * 
 * Note: Font names with spaces use underscores in imports
 * Examples: 'Open Sans' → Open_Sans, 'Space Grotesk' → Space_Grotesk
 */

import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'

// Primary font - used for body text and most UI elements
export const primaryFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Regular, Medium, SemiBold, Bold
  variable: '--font-primary',
  display: 'swap', // Shows fallback until font loads
})

// Heading font - used for h1, h2, h3, h4, h5, h6
export const headingFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'], // Medium, SemiBold, Bold
  variable: '--font-heading',
  display: 'swap',
})

// Mono font - used for code, pre, kbd, samp
export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Regular, Medium, Bold
  variable: '--font-mono',
  display: 'swap',
})

// Export all font variables as a single string for className usage
// Applied to <body> in src/layouts/root-layout.tsx
export const fontVariables = `${primaryFont.variable} ${headingFont.variable} ${monoFont.variable}`


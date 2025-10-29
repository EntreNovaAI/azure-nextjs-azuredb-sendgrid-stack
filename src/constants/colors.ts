/**
 * Color Constants
 * Simple color configuration for light and dark modes
 * Modify these values to change the app's color scheme
 */

// Light Mode Colors
export const lightColors = {
  // Primary brand color - used for main actions and highlights
  primary: "#37353E", 
  
  // Secondary color - used for supporting elements
  secondary: '#44444E', 
  
  // Accent color - used for special highlights and CTAs
  accent: '#715A5A', 
  
  // Background colors
  background: '#ECF4E8', 
  backgroundAlt: '#FCF9EA', 
  
  // Text colors
  text: '#222831',
  textSecondary: '#DFD0B8', 
}

// Dark Mode Colors
export const darkColors = {
  // Primary brand color - slightly adjusted for dark mode
  primary: '#fb923c', // Orange-400
  
  // Secondary color
  secondary: '#f472b6', // Pink-400
  
  // Accent color
  accent: '#fbbf24', // Yellow-400
  
  // Background colors
  background: '#0f172a', // Slate-900
  backgroundAlt: '#1e293b', // Slate-800
  
  // Text colors
  text: '#f8fafc', // Slate-50
  textSecondary: '#cbd5e1', // Slate-300
}

// Export a function to get colors based on theme
export const getColors = (isDark: boolean) => isDark ? darkColors : lightColors

// Export default (can be imported as a single object)
export const colors = {
  light: lightColors,
  dark: darkColors,
}


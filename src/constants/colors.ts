/**
 * Color Constants
 * Simple color configuration for light and dark modes
 * Modify these values to change the app's color scheme
 */

// Light Mode Colors
export const lightColors = {
  // Primary brand color - used for main actions and highlights
  primary: "#2A004E", // Deep purple - bold and sophisticated
  
  // Secondary color - used for supporting elements
  secondary: '#500073', // Medium purple - rich and vibrant
  
  // Accent color - used for special highlights and CTAs
  accent: '#C62300', // Deep red - powerful call-to-action color
  
  // Background colors
  background: '#FFFFFF', // Clean white background
  backgroundAlt: '#F8F7FA', // Subtle light purple tint
  
  // Text colors
  text: '#1A1A1A', // Near black for primary text
  textSecondary: '#F14A00', // Vibrant orange for highlights and secondary elements 
}

// Dark Mode Colors
export const darkColors = {
  // Primary brand color - slightly adjusted for dark mode
  primary: '#6B21A8', // Lighter purple for better contrast in dark mode
  
  // Secondary color
  secondary: '#7C3AED', // Vibrant purple for supporting elements
  
  // Accent color
  accent: '#EF4444', // Bright red for CTAs in dark mode
  
  // Background colors
  background: '#0F0A1A', // Very dark purple-black
  backgroundAlt: '#1A0F2E', // Dark purple
  
  // Text colors
  text: '#F9FAFB', // Off-white for primary text
  textSecondary: '#FB923C', // Warm orange for secondary elements
}

// Export a function to get colors based on theme
export const getColors = (isDark: boolean) => isDark ? darkColors : lightColors

// Export default (can be imported as a single object)
export const colors = {
  light: lightColors,
  dark: darkColors,
}


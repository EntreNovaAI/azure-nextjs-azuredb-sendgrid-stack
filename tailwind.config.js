const { lightColors, darkColors } = require('./src/constants/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Paths to all files that will contain Tailwind class names
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Use class-based dark mode to keep behavior explicit and predictable
  darkMode: 'class',

  theme: {
    extend: {
      // Extend Tailwind's default theme if needed
      backdropBlur: {
        xs: '2px',
      },
      // Custom color extensions from colors.ts
      // Use these semantic names throughout the app
      colors: {
        // Brand colors that automatically switch between light/dark mode
        brand: {
          primary: lightColors.primary,
          secondary: lightColors.secondary,
          accent: lightColors.accent,
        },
        // Light mode colors (use with light: prefix or no prefix)
        light: {
          bg: lightColors.background,
          'bg-alt': lightColors.backgroundAlt,
          text: lightColors.text,
          'text-secondary': lightColors.textSecondary,
        },
        // Dark mode colors (use with dark: prefix)
        dark: {
          bg: darkColors.background,
          'bg-alt': darkColors.backgroundAlt,
          text: darkColors.text,
          'text-secondary': darkColors.textSecondary,
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};



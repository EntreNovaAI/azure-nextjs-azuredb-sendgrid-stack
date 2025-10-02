/** @type {import('tailwindcss').Config} */
module.exports = {
  // Paths to all files that will contain Tailwind class names
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Use class-based dark mode to keep behavior explicit and predictable
  darkMode: 'class',

  theme: {
    extend: {
      // Extend Tailwind's default theme if needed
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};



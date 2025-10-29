# Color System Documentation

## Overview

This project uses a simple, centralized color system. All colors are defined in `src/constants/colors.ts` and automatically integrated into Tailwind CSS.

## How to Change Colors

### Step 1: Edit colors.ts

Edit the color values in `src/constants/colors.ts`:

```typescript
// Light Mode Colors
export const lightColors = {
  primary: '#CBF3BB',      // Main brand color
  secondary: '#ABE7B2',     // Supporting color
  accent: '#93BFC7',        // Accent/highlight color
  background: '#ECF4E8',    // Main background
  backgroundAlt: '#FCF9EA', // Alternative background
  text: '#0f172a',          // Primary text
  textSecondary: '#64748b', // Secondary text
}

// Dark Mode Colors
export const darkColors = {
  primary: '#fb923c',       // Main brand color (adjusted for dark)
  secondary: '#f472b6',     // Supporting color
  accent: '#fbbf24',        // Accent/highlight color
  background: '#0f172a',    // Main background
  backgroundAlt: '#1e293b', // Alternative background
  text: '#f8fafc',          // Primary text
  textSecondary: '#cbd5e1', // Secondary text
}
```

### Step 2: That's It!

The colors will automatically be available throughout your app via Tailwind classes.

## Using Colors in Components

### Brand Colors (Primary, Secondary, Accent)

These work the same in both light and dark mode:

```tsx
// Text colors
<span className="text-brand-primary">Primary brand text</span>
<span className="text-brand-secondary">Secondary brand text</span>
<span className="text-brand-accent">Accent text</span>

// Background colors
<div className="bg-brand-primary">Primary background</div>
<div className="bg-brand-secondary/20">Secondary with opacity</div>

// Borders
<div className="border border-brand-primary">Bordered element</div>

// Gradients
<div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
  Gradient background
</div>
```

### Theme-Aware Colors (Backgrounds and Text)

These automatically switch between light and dark mode:

```tsx
// Text colors that adapt to theme
<p className="text-light-text dark:text-dark-text">
  Main text that adapts to theme
</p>

<p className="text-light-text-secondary dark:text-dark-text-secondary">
  Secondary text that adapts to theme
</p>

// Background colors that adapt to theme
<div className="bg-light-bg dark:bg-dark-bg">
  Background that adapts to theme
</div>

<div className="bg-light-bg-alt dark:bg-dark-bg-alt">
  Alternative background that adapts to theme
</div>
```

## Color Classes Reference

### Brand Colors
- `brand-primary` - Main brand color
- `brand-secondary` - Supporting brand color
- `brand-accent` - Accent/highlight color

### Light Mode Colors
- `light-bg` - Main background (light mode)
- `light-bg-alt` - Alternative background (light mode)
- `light-text` - Primary text (light mode)
- `light-text-secondary` - Secondary text (light mode)

### Dark Mode Colors
- `dark-bg` - Main background (dark mode)
- `dark-bg-alt` - Alternative background (dark mode)
- `dark-text` - Primary text (dark mode)
- `dark-text-secondary` - Secondary text (dark mode)

## Updated Components

The following components and pages now use the centralized color system:

### UI Components
1. **product-card.tsx** - Product cards with variant styling
2. **feature-card.tsx** - Feature showcase cards
3. **hero-section.tsx** - Hero section with gradient text
4. **navigation.tsx** - Navigation bar with brand colors
5. **page-states.tsx** - Loading and auth states
6. **password-input.tsx** - Password input with focus states
7. **login-button.tsx** - Login/logout button with brand accent

### App Pages
8. **app/page.tsx** - Home page with gradient backgrounds
9. **app/error.tsx** - Error page styling
10. **app/auth/signup/page.tsx** - Sign up page
11. **app/auth/forgot-password/page.tsx** - Forgot password page
12. **app/auth/reset-password/[token]/page.tsx** - Reset password page
13. **app/checkout/page.tsx** - Checkout page
14. **app/checkout/return/page.tsx** - Checkout return/success page
15. **app/checkout/layout.tsx** - Checkout layout

## Benefits

1. **Simple** - Change colors in one place (`colors.ts`)
2. **Consistent** - All components use the same color palette
3. **Maintainable** - Easy to update the entire app's color scheme
4. **Type-safe** - Colors are defined in TypeScript
5. **Automatic** - Tailwind config reads from colors.ts

## Example: Changing Your Brand Colors

To change your brand colors from the current green/blue theme to a red/purple theme:

```typescript
// In src/constants/colors.ts

export const lightColors = {
  primary: '#ef4444',      // Red-500
  secondary: '#a855f7',    // Purple-500
  accent: '#f59e0b',       // Amber-500
  // ... rest stays the same
}

export const darkColors = {
  primary: '#f87171',      // Red-400
  secondary: '#c084fc',    // Purple-400
  accent: '#fbbf24',       // Amber-400
  // ... rest stays the same
}
```

Save the file, and all components will automatically use the new colors!


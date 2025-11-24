# Development Principles

> **Building with clarity and simplicity** ✨

Welcome! These principles are designed to help guide how we organize and build projects. They're designed to make development smooth, changes easy, and collaboration peasy.

---

## 🎯 Core Philosophy

### Explicit Over Implicit

**Clarity is the ultimate optimization.** Every component, every file, every decision should be as obvious and intentional as possible.

- Mark all client components with `'use client'` at the top
- Mark all server components with `'use server'` at the top  
- Be explicit about what things do and where they belong
- Resist the urge to rely on assumptions or "obvious" behavior

### Modular & Changeable

**We want to build for flexibility.** Everything should be easy to modify without massive refactoring.

- Keep components small and focused
- Separate concerns clearly
- Think: "How easy would this be to change in 6 months"

---

## 📁 Project Structure

### Clean Separation of Concerns

 Here's where everything lives:

#### 🎨 Marketing & Content

**App Routes:**
- `app/(marketing)/` - Landing pages, about, pricing, etc.
- `app/(legal)/` - Terms, privacy, contact pages
etc.

**Content Philosophy:**

- Store all text in objects at the top of each page when it makes sense to do so
- We'd like to make marketing updates fast and easy.
- No hunting through JSX/HTML to change wording
- Marketing team can update content without touching logic

**Example:**
```typescript
// ✅ Good - Text separated at top
const content = {
  hero: {
    title: "Build Amazing Things",
    subtitle: "Start shipping faster",
  }
}

export default function LandingPage() {
  return <h1>{content.hero.title}</h1>
}

// ❌ Bad - Text mixed in JSX
export default function LandingPage() {
  return <h1>Build Amazing Things</h1>
}
```

#### 🔧 Application Logic

**Source Code:**

- `src/` - All business logic, utilities, and libraries
- `src/product/` - Product-specific logic and features
- `src/lib/` - Shared libraries (auth, database, etc.)
- `src/components/` - Reusable UI components

**App Routes:**

- `app/(product)/` - Dashboard, settings, product pages
- `app/(app)/api/` - API routes and endpoints

**Principle:** Logic lives in `src/`, pages live in `app/`.

#### 🌐 Public Assets

**Static Files:**

- `public/` - Images, icons, fonts, any public static files
- These are served directly at the root URL path

---

## 🎨 Centralized Design System

### Colors - One Source of Truth

**All colors are defined in `src/styles/globals.css` using CSS variables**

This ensures consistent branding across the entire application and makes theme updates trivial. Colors automatically adapt to light/dark mode via `next-themes`.

```typescript
// ✅ Good - Uses Tailwind classes (automatically theme-aware)
return (
  <button className="bg-primary text-white hover:bg-accent">
    Click me
  </button>
)
```

```typescript
// ✅ Good - Uses CSS variables for inline styles
return (
  <button style={{ backgroundColor: 'var(--color-primary)' }}>
    Click me
  </button>
)
```

```typescript
// ❌ Bad - Hardcoded colors
return (
  <button style={{ backgroundColor: '#FF5733' }}>
    Click me
  </button>
)
```

**Why?**
- Change brand colors in one place (`globals.css`), updates everywhere
- Automatic light/dark mode support via `next-themes`
- No JavaScript needed - pure CSS solution
- No color inconsistencies across pages
- Marketing can update branding without touching code

**Available Tailwind classes:**
- `bg-primary` / `text-primary` - Main brand color
- `bg-secondary` / `text-secondary` - Supporting elements
- `bg-accent` / `text-accent` - CTAs and highlights
- `bg-background` / `text-text` - Page backgrounds and text

**Available CSS variables:**
- `var(--color-primary)` or `var(--theme-primary)` - Main brand color
- `var(--color-secondary)` or `var(--theme-secondary)` - Supporting elements
- `var(--color-accent)` or `var(--theme-accent)` - CTAs and highlights
- `var(--color-background)` or `var(--theme-background)` - Page background
- `var(--color-text)` or `var(--theme-text)` - Text color

**To change colors:** 
- Use the `/style` command in Cursor for guided color updates
- Or manually edit `src/styles/globals.css` - modify the `:root` section for light mode and `.dark` section for dark mode

### Fonts - Globally Configured

**All fonts are configured in `src/styles/globals.css` using CSS variables**

Fonts are loaded via Next.js font optimization in `src/layouts/root-layout.tsx` and applied globally through CSS variables in `globals.css`. No need to import fonts in individual components.

```typescript
// ✅ Good - Fonts already applied globally via CSS
export default function MyPage() {
  return (
    <div>
      <h1>This uses the heading font automatically</h1>
      <p>This uses the primary font automatically</p>
      <code>This uses the mono font automatically</code>
    </div>
  )
}
```

```typescript
// ❌ Bad - Don't import fonts in components
import { Inter } from 'next/font/google'

export default function MyPage() {
  return <div className={Inter.className}>Text</div>
}
```

**Why?**
- Fonts are configured in `globals.css` using CSS variables (similar to colors)
- Integrated with next-themes for consistent theming
- Fonts load once, not in every component
- Consistent typography across the app
- Better performance (no duplicate font loads)
- Next.js automatically optimizes and self-hosts fonts

**Available font CSS variables:**
- `var(--font-family-main)` - Main body font (applied to `body`)
- `var(--font-family-heading)` - Heading font (applied to `h1-h6`)
- `var(--font-family-mono)` - Monospace font (applied to `code`, `pre`)

**To change fonts:**
- Use the `/style` command in Cursor for guided font updates
- Or manually:
  1. Edit `src/layouts/root-layout.tsx` - change the font import and loader (e.g., `Inter` → `Roboto`)
  2. Edit `src/styles/globals.css` - update the CSS variable references in the `@theme` section
  3. Restart dev server
  4. Done! Font applies everywhere automatically

### Theme Awareness Pattern

**When building theme-aware components:**

Colors automatically adapt to light/dark mode via CSS variables. No JavaScript needed for most cases!

```typescript
// ✅ Good - Tailwind theme classes automatically adapt to theme
'use client'

export default function ThemedComponent() {
  return (
    <div className="bg-background text-text">
      <button className="bg-primary hover:bg-accent">
        Adapts to light/dark mode automatically
      </button>
    </div>
  )
}
```

```typescript
// ✅ Good - Tailwind dark: modifier for specific dark mode styles
'use client'

export default function ThemedComponent() {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      Uses different colors for light and dark modes
    </div>
  )
}
```

```typescript
// ✅ Good - CSS variables for inline styles (if needed)
'use client'

export default function ThemedComponent() {
  return (
    <div style={{ 
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text)'
    }}>
      Adapts to light/dark mode automatically
    </div>
  )
}
```

```typescript
// ✅ Good - Using useTheme() to set theme (like ThemeToggle)
'use client'

import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to dark mode
    </button>
  )
}
```

```typescript
// ⚠️ Advanced - Only needed for Canvas, SVG, or dynamic color calculations
// Most components should use Tailwind classes or CSS variables instead!
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function AdvancedThemedComponent() {
  const { resolvedTheme } = useTheme()
  const [colors, setColors] = useState({ primary: '#FFBC4C' })
  
  useEffect(() => {
    // Only use this if you need actual color values for Canvas API, SVG, or calculations
    // Canvas can't use CSS variables directly - needs actual color strings
    const themeColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-primary').trim()
    
    setColors({ primary: themeColor || '#FFBC4C' })
    
    // Example: Use in canvas drawing
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.fillStyle = colors.primary
      // ... draw with theme color
    }
  }, [resolvedTheme])
  
  return <canvas ref={canvasRef} />
}
```

**When you might need this (advanced cases only):**
- **Canvas API** - Canvas can't use CSS variables directly, needs actual color values
- **SVG manipulation** - When setting SVG attributes dynamically in JavaScript
- **Color calculations** - Converting hex to RGB, calculating gradients programmatically
- **Third-party libraries** - Libraries that require actual color values, not CSS variables

**Note:** 99% of components should use Tailwind classes (`bg-primary`) or CSS variables (`var(--color-primary)`) instead. Only use this pattern when you absolutely need JavaScript color values.

**Benefits:**
- Colors automatically adapt to theme via CSS
- No hydration errors (CSS handles theme switching)
- Consistent theme behavior across all components
- Works with system preferences automatically
- Simpler code - no need for mounted state guards

---

## 🧩 Component Guidelines

### Server vs Client Components

**Always be explicit:**

```typescript
// Client component - interactive, uses hooks
'use client'

export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Click me</button>
}
```

```typescript
// Server component - data fetching, no interactivity
'use server'

export async function UserProfile() {
  const user = await fetchUser()
  return <div>{user.name}</div>
}
```

**Why?** Makes it crystal clear what runs where. No guessing.

### Content Separation

**For pages with text content:**

```typescript
'use client'

// Content object at the top - easy to find and update
const pageContent = {
  title: "Welcome to Our Platform",
  description: "Build something amazing today",
  cta: {
    primary: "Get Started",
    secondary: "Learn More"
  },
  features: [
    "Fast deployment",
    "Secure by default",
    "Scale with ease"
  ]
}

export default function MarketingPage() {
  return (
    <div>
      <h1>{pageContent.title}</h1>
      <p>{pageContent.description}</p>
      {/* Use content object throughout */}
    </div>
  )
}
```

**Benefits:**

- Marketing updates don't touch code logic
- Easy to find all text in one place
- Simple to make the content dynamic later
- Clear separation of what vs how

---

## 🚀 Workflow Optimization

### Cursor Commands for Repetitive Tasks

**If you find yourself doing the same simple task repeatedly, consider creating a Cursor command.**

Example: We have `/style` command for updating colors and fonts to help streamline the design iteration process for example.

**When to create a command:**

- Task is simple and well-defined
- You do it more than 3 times
- It follows a clear pattern
- It would save time for others

**See:** `.cursor/commands/style.md` for an example

---

## ✅ Quick Checklist

Before committing code, ask yourself:

- [ ] Is it clear if this is a client or server component?
- [ ] Is the logic in `src/` and the page in `app/`?
- [ ] Is marketing text in a content object at the top?
- [ ] Are colors using Tailwind classes (`bg-primary`, `text-primary`, etc.) or CSS variables (`var(--color-primary)`)?
- [ ] Are fonts relying on global config (not imported in component)?
- [ ] Would this be easy to change in 6 months?
- [ ] Is it modular and focused on one thing?
- [ ] Have I been explicit about what this does?

---

## 🎨 Why These Principles?

**For Marketing Team:**

- Update copy and content without touching code
- No risk of breaking functionality
- Fast iteration on messaging
- Change brand colors/fonts in one place

**For Developers:**

- Clear structure makes onboarding fast
- Easy to find things
- Changes don't cascade unexpectedly
- Less refactoring, more building
- Centralized design system prevents inconsistencies

**For Designers:**

- Update brand colors once, applies everywhere
- Change fonts globally with no code changes
- Consistent look and feel guaranteed
- Light/dark mode works automatically

**For Everyone:**

- Explicit code is maintainable code
- Modular structure prevents spaghetti
- Good organization scales with the team
- Unified design system ensures quality

---

**Remember:** We know that most of these things are obvious to you. This is designed to serve simply as a reminder and an effort to help us stay united in our development goals. These principles, are just that, principles! If something doesn't make sense for your use case, that's okay!

Happy coding! 🚀

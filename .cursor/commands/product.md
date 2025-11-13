# product

## Personality

Expert product page designer for SaaS apps. Build in `app/(product)` using the unified design system. Follow `docs/DEVELOPMENT_PRINCIPLES.MD`.

## Core Principles (CRITICAL)

### 🎯 Explicit Over Implicit

- **ALWAYS** mark with `'use client'` or `'use server'` at top
- No implicit behavior - clarity is the ultimate optimization

### 📁 Separation of Concerns

- **Logic in `src/`** - business logic, utilities, reusable components
- **Pages in `app/`** - thin composition layer only
- Ask: "Would this be useful elsewhere?" → Put it in `src/`

### 📝 Content Dictionary (MANDATORY)

- **ALWAYS** define content dictionaries at top
- Never hardcode text in JSX - makes updates fast and safe

### 🔄 Modular & Changeable

- Build for flexibility, keep components small and focused

## Activation

Present these options:
1. Build a new product page
2. Enhance an existing product page
3. Build a dashboard or product feature
4. Create reusable product components

Wait for user to choose before proceeding.

## Command Options

### 1. Build New Product Page

**Need:** Route, purpose, data to display, interactions, API endpoints

**Process:** Create logic in `src/product/[feature]/` → Create page in `app/(product)/[name]/page.tsx` → Mark with `'use client'`/`'use server'` → Add content dictionary → Use shadcn components → Import from `src/` → Test

### 2. Enhance Existing Page

Read file → Check for `'use client'`/`'use server'` → Check for content dictionary → Move logic to `src/` if needed → Make improvements → Test

### 3. Build Dashboard/Feature

Break into components → Create in `src/product/[feature]/` → Mark ALL with `'use client'`/`'use server'` → Build components → Create thin page in `app/` → Test

### 4. Create Reusable Components

Design API → Create in `src/components/` or `src/product/[feature]/components/` → Mark explicitly → Add content dictionary → Export from `index.ts`

## Technical Requirements (MUST FOLLOW)

### 1. Always Mark Components Explicitly

- **ALWAYS** start with `'use client'` or `'use server'` - no exceptions
- Makes it crystal clear what runs where

### 2. Use MainLayout

- Import and wrap: `import { MainLayout } from '@/src/layouts'`
- Optional props: `showFooter`, `containerClass`

### 3. Unified Color System

- Import: `import { getColors } from '@/src/constants/colors'`
- Use: `const colors = getColors(isDark)`
- Available: `primary`, `secondary`, `accent`, `background`, `text`, `textSecondary`
- Apply: `style={{ color: colors.primary }}`
- Check `@/src/constants/colors.ts` for all properties

### 4. Fonts (Already Configured)

- Don't import fonts - configured globally in `src/lib/fonts/font-loader.ts`
- Use semantic HTML and Tailwind classes

### 5. shadcn Components

- Import from `@/src/components/ui`
- Available: `Button`, `Card`, `Input`, `PasswordInput`, `DropdownMenu`, `Sheet`, `Separator`, `ThemeToggle`, `Navigation`, `FeatureCard`, `HeroSection`, `ProductCard`, `PageStates`, `UserInfo`
- Build on these instead of creating from scratch

### 6. Content Dictionary (MANDATORY)

- **ALWAYS** define at top of components
- All text, labels, URLs, config **MUST** be in dictionary
- Never hardcode text in JSX
- Enables non-technical users to update content safely

### 7. Theme Awareness

- Use `'use client'` for: theme awareness, interactions, browser APIs, React hooks
- Import `useTheme` from 'next-themes'
- Implement mounted state to prevent hydration errors

### 8. File Structure (CRITICAL)

```plaintext
app/(product)/feature-name/page.tsx  # Thin composition only
src/product/feature-name/
  ├── components/      # Feature components
  ├── data/           # Constants, configs
  └── utils/          # Utilities, helpers
```
**Rule:** Logic in `src/`, pages in `app/`. Pages should be thin composition layers.

## Example Page Structure

```typescript
'use client'

import { MainLayout } from '@/src/layouts'
import { getColors } from '@/src/constants/colors'
import { Button, Card } from '@/src/components/ui'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

// Content Dictionary - MANDATORY
const content = {
  title: "Product Analytics",
  subtitle: "Track your product performance",
  metrics: [
    { label: "Active Users", value: "1,234", change: "+12%" },
    { label: "Revenue", value: "$45.2K", change: "+23%" },
  ],
  ctaText: "Export Report"
}

export default function AnalyticsPage() {
  // Theme awareness
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const colors = getColors(mounted ? resolvedTheme === 'dark' : false)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 style={{ color: colors.primary }}>{content.title}</h1>
        <p className="text-foreground/70">{content.subtitle}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {content.metrics.map((m, i) => (
            <Card key={i}>
              <div>{m.label}</div>
              <div className="text-3xl">{m.value}</div>
              <div style={{ color: m.change.startsWith('+') ? colors.secondary : colors.accent }}>
                {m.change}
              </div>
            </Card>
          ))}
        </div>
        
        <Button style={{ backgroundColor: colors.accent }}>
          {content.ctaText}
        </Button>
      </div>
    </MainLayout>
  )
}
```

## Design Principles

- **Simplicity:** Clean interfaces, one primary action per section
- **Consistency:** Use unified color system and shadcn components
- **Responsiveness:** Mobile-first, test all breakpoints (`sm:`, `md:`, `lg:`)
- **Accessibility:** Semantic HTML, ARIA labels, sufficient contrast
- **Performance:** Lazy load when needed, optimize images
- **Modularity:** Build reusable, separate concerns (data, logic, UI)

## Component Structure Template

```typescript
// 1. Mark explicitly - ALWAYS
'use client' // or 'use server'

// 2. Imports (grouped)
import { /* React/Next */ } from 'react'
import { /* Local - from src/ */ } from '@/src'

// 3. Types
interface Props { }

// 4. Content Dictionary - MANDATORY
const content = {
  // All text, labels, URLs, config here
}

// 5. Component
export default function ComponentName(props: Props) {
  // a. Hooks, b. State, c. Effects, d. Handlers, e. Render
  return (/* JSX */)
}
```

**File Naming:** Pages: `page.tsx` | Components: `kebab-case.tsx` | Data: `kebab-case.ts` | Exports: `index.ts`

## Workflow Quick Reference

### Option 1: Build New Page

Collect info → Create logic in `src/product/[feature]/` → Create page in `app/(product)/[name]/page.tsx` → Mark with `'use client'`/`'use server'` → Add content dictionary → Use MainLayout + getColors() + shadcn → Import from `src/` → Test themes & responsiveness

### Option 2: Enhance Existing

Read file → Add `'use client'`/`'use server'` if missing → Add content dictionary if missing → Move logic to `src/` if needed → Make improvements → Test

### Option 3: Dashboard/Feature

Break down → Create `src/product/[feature]/` structure → Mark ALL with `'use client'`/`'use server'` → Build components → Add content dictionaries → Create thin page in `app/` → Compose → Test

### Option 4: Reusable Components

Design API → Create in `src/components/` → Mark explicitly → Add content dictionary → Build on shadcn → Make theme-aware → Export from `index.ts`

## Checklist Before Completion

**Top 3 Critical:**

1. ✅ Marked with `'use client'` or `'use server'`
2. ✅ Logic in `src/`, pages in `app/`
3. ✅ Content dictionary at top (no hardcoded text)

**Standard Checks:**

- ✅ Uses `MainLayout` wrapper
- ✅ Uses `getColors()` for theme-aware colors
- ✅ Uses existing shadcn components
- ✅ Includes helpful comments
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Works in light and dark mode
- ✅ No hardcoded colors
- ✅ Clean, modular code
- ✅ Proper TypeScript types
- ✅ Accessible (semantic HTML, ARIA)

## Key Reminders

1. **Be explicit - ALWAYS** - Mark with `'use client'`/`'use server'`. No exceptions.
2. **Separate concerns** - Logic in `src/`, pages in `app/`. Ask: "Useful elsewhere?" → `src/`
3. **Content dictionaries mandatory** - Never hardcode text in JSX
4. **Use unified color system** - Never use `#FF0000` or `text-blue-500`. Use `getColors()` or Tailwind theme classes
5. **Fonts already configured** - Don't import fonts, they're global
6. **Build on existing** - Check `@/src/components/ui` first
7. **Theme awareness critical** - Test both light and dark modes
8. **Think modular** - Create reusable components in `src/`
9. **Keep it simple** - Clean, readable code over clever code
10. **Comment your code** - Clear, simple language in short sentences

## Core Philosophy

**Explicit Over Implicit** - Clarity is the ultimate optimization. Every component, file, and decision should be obvious and intentional.

**Modular & Changeable** - Build for flexibility. Think: "How easy would this be to change in 6 months?"

---

*This command is available in chat with `/product`*

# Cursor Commands Guide

This guide explains how to use the specialized cursor commands in this project to streamline development workflows.

## Overview

Cursor commands are AI-powered assistants that help you build and configure specific aspects of your SaaS application. Each command is an expert in its domain and provides guided workflows to complete tasks quickly and consistently.

## Available Commands

### 🚀 `/init` - Project Initialization
**Purpose:** Set up the project for local development from a fresh git clone.

**Example Usage:**
```
/init
```
Then follow the step-by-step instructions provided.

---

### 🎨 `/style` - Visual Styling
**Purpose:** Update the visual style and branding of your application.

**Use When:**
- Want to change theme colors (light/dark mode)
- Need to update fonts throughout the app
- Customizing brand appearance

**What It Does:**
- Updates color system in `src/constants/colors.ts`
- Changes fonts by modifying `src/constants/fonts.ts` and `src/lib/fonts/font-loader.ts`
- Ensures consistent theming across all components
- Validates accessibility and contrast

**Example Usage:**
```
/style
```
Choose option 1 (colors) or 2 (fonts), then provide your preferences.

---

### 📦 `/product` - Product Pages & Features
**Purpose:** Build and enhance product pages, dashboards, and internal features.

**Use When:**

- Creating a new product page or dashboard
- Adding features to existing product pages
- Building data tables, charts, or interactive tools
- Creating reusable product components

**What It Does:**

- Creates pages in `app/(product)` folder
- Enforces unified design system (MainLayout, color system, shadcn components)
- Uses content dictionary pattern for easy customization
- Builds responsive, theme-aware components
- Follows strict technical standards for consistency

**Key Features:**

- Always uses `MainLayout` for consistent structure
- Leverages unified color system with `getColors()`
- Content dictionary pattern separates content from code
- Uses existing shadcn components
- Works in both light and dark modes

**Example Usage:**

```
/product
```
Choose from 4 options:

1. Build a new product page (direct)
2. Enhance an existing page
3. Build a dashboard or complex feature
4. Create reusable components

---

### 🎯 `/ad-page` - Marketing Pages

**Purpose:** Create high-converting marketing and promotional pages.

**Use When:**

- Launching a new product or feature
- Creating promotional campaigns
- Building landing pages for ads
- Need a simple, focused marketing page

**What It Does:**

- Creates pages in `app/(marketing)` folder
- Builds mobile-first, single-scroll marketing pages
- Uses proven conversion patterns (hero, value prop, CTA, social proof)
- Maintains consistent branding with unified design system
- Makes content easy to update via content dictionary

**Two Workflows:**

1. **Direct Build** - You provide all content, it builds immediately
2. **Guided Brainstorm** - 10-step process to help you plan your page

**Example Usage:**
```
/ad-page
```
Choose option 1 (direct) if you have content ready, or option 2 (guided) to brainstorm.

---

### 🏠 `/landing-page` - Landing Page Updates

**Purpose:** Make changes to the main landing page.

**Use When:**

- Updating the home page (`app/(marketing)/landing-page/page.tsx`)
- Modifying hero section, features, or CTAs
- Changing landing page content or layout

**What It Does:**

- Maintains shadcn component usage
- Preserves dark/light mode functionality
- Respects the unified color and font system
- Keeps responsive design structure

**Example Usage:**
```
/landing-page
```
Then describe what you want to change on the landing page.

---


---

## Design Philosophy

All commands follow these core principles:

### 🎯 Consistency First
- Every command uses the unified design system
- MainLayout for structure
- `getColors()` for theme-aware colors
- shadcn components for UI elements

### 📝 Content Dictionary Pattern
- All text, URLs, and configuration in a dictionary at the top
- Separates "what to display" from "how to display it"
- Makes customization easy for non-technical users
- Changes don't require touching component logic

### 🌓 Theme Awareness

- All components work in light and dark modes
- Uses `useTheme()` hook for theme detection
- Prevents hydration errors with mounted state
- Colors adapt automatically

### 📱 Mobile-First

- Responsive design is standard
- Test on mobile, tablet, desktop
- Touch-friendly interactions
- Tailwind responsive utilities (`sm:`, `md:`, `lg:`)

### ♿ Accessibility Built-In

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation (via shadcn)
- Sufficient color contrast

### 🧩 Modular & Reusable

- Build components that can be reused
- Keep files small and focused (<200 lines)
- Export via `index.ts` for easy imports
- Separate concerns (data, logic, presentation)

---

## Technical Standards

All commands enforce these technical requirements:

### File Structure

```
app/
├── (product)/           # Internal product pages
│   └── [feature-name]/
│       ├── _data/       # Mock data, configs
│       ├── components/  # Feature-specific components
│       └── page.tsx     # Main page
├── (marketing)/         # Marketing pages
│   └── [page-name]/
│       └── page.tsx
```

### Required Imports

```typescript
'use client' // For interactive/theme-aware components

import { MainLayout } from '@/src/layouts'
import { getColors } from '@/src/constants/colors'
import { Button, Card } from '@/src/components/ui'
import { useTheme } from 'next-themes'
```

### Content Dictionary Pattern

```typescript
// Content Dictionary - Easy to customize!
const content = {
  title: "Page Title",
  subtitle: "Description text",
  ctaText: "Button Text",
  ctaLink: "/target-url",
  // ... all content here
}
```

### Theme Awareness

```typescript
const { resolvedTheme } = useTheme()
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

const colors = getColors(mounted ? resolvedTheme === 'dark' : false)
```

## Best Practices

### When Using Commands

1. **Start with the right command** - Each command has a specific purpose
2. **Follow the workflow** - Commands guide you step-by-step
3. **Provide complete information** - Better input = better output
4. **Test after changes** - Always verify in browser (light and dark mode)
5. **Iterate** - Commands can be run multiple times

### Code Organization

- Keep components small and focused
- Use content dictionaries for all customizable content
- Comment your code with clear explanations
- Follow the existing patterns in the codebase
- Build on existing components rather than creating from scratch

### Customization

All commands make it easy to customize later:

- **Content** - Update content dictionaries
- **Colors** - Change in `src/constants/colors.ts`
- **Fonts** - Update in `src/constants/fonts.ts`
- **Components** - Extend or compose existing shadcn components

---

## Getting Help

### Documentation

- **Local Development:** `docs/LOCAL_DEVELOPMENT.MD`
- **Workflow:** `docs/WORKFLOW.MD`
- **Infrastructure:** `docs/INFRASTRUCTURE.md`
- **Database:** `docs/DB.MD`
- **Docker:** `docs/DOCKER.md`

## Summary

Cursor commands streamline development by:

✅ **Enforcing consistency** - All output follows the same patterns
✅ **Saving time** - Guided workflows prevent mistakes
✅ **Maintaining standards** - Technical requirements are built-in
✅ **Making customization easy** - Content dictionaries separate concerns
✅ **Providing expertise** - Each command is a domain expert

Use them to build faster, more consistently, and with confidence that best practices are followed.

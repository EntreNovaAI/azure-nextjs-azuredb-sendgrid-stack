# landing-page

## Purpose
User wants to make changes to the landing page located at `app/(marketing)/landing-page/page.tsx`.

## Requirements

### 1. Use Shadcn Components

- ALWAYS use shadcn/ui components from `@components/ui`
- Available components: Button, Card, CardContent, Separator, ProductCard, FeaturesSection, etc.
- Keep the UI consistent with the existing component library

### 2. Maintain Dark/Light Mode Functionality

- The page uses `next-themes` for theme management
- ALWAYS get the current theme: `const { resolvedTheme } = useTheme()`
- Get theme-appropriate colors: `const colors = getColors(resolvedTheme === 'dark')`
- Ensure all new elements work in both light and dark modes

### 3. Integrate Constants for Easy Customization

- Colors: Import from `@constants/colors`
  - User can easily change brand colors in `src/constants/colors.ts`
  - Use `colors.primary`, `colors.secondary`, `colors.accent` for brand elements
  - Use `colors.background`, `colors.text` for base elements
- Fonts: Reference from `@constants/fonts`
  - User can change fonts in `src/constants/fonts.ts`
  - Fonts are auto-applied globally via font-loader

### 4. How Colors Work

```typescript
// Get theme-aware colors
const { resolvedTheme } = useTheme()
const colors = getColors(resolvedTheme === 'dark')

// Use in inline styles for gradients
style={{ backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}

// Or use Tailwind classes for simple colors
className="bg-brand-primary text-brand-accent"
```

### 5. Structure to Maintain

- Use `MainLayout` wrapper for consistent page structure
- Keep sections organized: Hero → Features → Plans → CTA
- Use responsive design (mobile-first approach)
- Include scroll anchors for navigation (e.g., `id="plans"`)

## Key Files

- **Landing Page**: `app/(marketing)/landing-page/page.tsx`
- **Colors**: `src/constants/colors.ts` (easy customization)
- **Fonts**: `src/constants/fonts.ts` (easy customization)
- **Components**: `@components/ui/*` (shadcn components)

## Quick Tips

- Make changes that respect the constants system
- Test in both light and dark modes
- Keep the code simple and readable
- Add helpful comments explaining any new sections
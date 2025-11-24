# Theming

This project uses `next-themes` for theme management and CSS variables for colors. Colors automatically adapt to light/dark mode via CSS - no JavaScript needed for most components.

## How It Works

**Theme Provider:** `next-themes` applies a `.dark` class to the `<html>` element when dark mode is active.

**Colors:** Defined in `src/styles/globals.css` using CSS variables that change based on the `.dark` class.

**Components:** Use Tailwind theme classes (`bg-primary`, `text-text`) or CSS variables (`var(--color-primary)`) - colors adapt automatically.

## Configuration

### Theme Provider

The theme provider is configured in `src/layouts/root-layout.tsx`:

```tsx:src/layouts/root-layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"      // Sets default to dark
  enableSystem={false}     // Disables system preference detection to enforce default
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

**To respect system preferences:**
1. Set `enableSystem={true}` (or remove the prop as it defaults to true)
2. Set `defaultTheme="system"`

### Color System

Colors are defined in `src/styles/globals.css`:

```css
/* Light mode colors */
:root {
  --theme-primary: #FFBC4C;
  --theme-background: #ffffff;
  --theme-text: #1a1a1a;
  --theme-secondary: #FFDE63;
  --theme-accent: #f59e0b;
}

/* Dark mode colors - applied when .dark class is on html */
.dark {
  --theme-primary: #FFDE63;
  --theme-background: #0f172a;
  --theme-text: #f8fafc;
  --theme-secondary: #FFBC4C;
  --theme-accent: #fbbf24;
}
```

**To change colors:**
- Use the `/style` command in Cursor for guided updates
- Or manually edit `src/styles/globals.css` - modify the `:root` section for light mode and `.dark` section for dark mode

## Using Themes in Components

### Preferred: Tailwind Theme Classes

```tsx
// Colors automatically adapt to theme
<div className="bg-background text-text">
  <button className="bg-primary hover:bg-accent">
    Theme-aware button
  </button>
</div>
```

**Available Tailwind classes:**
- `bg-primary` / `text-primary` - Main brand color
- `bg-secondary` / `text-secondary` - Supporting elements
- `bg-accent` / `text-accent` - CTAs and highlights
- `bg-background` / `text-text` - Page backgrounds and text

### Alternative: CSS Variables

```tsx
// For inline styles
<div style={{ 
  backgroundColor: 'var(--color-background)',
  color: 'var(--color-text)'
}}>
  Theme-aware content
</div>
```

### Advanced: Tailwind dark: Modifier

```tsx
// For specific dark mode overrides (not usually needed)
<div className="bg-gray-100 dark:bg-gray-800">
  Specific light/dark colors
</div>
```

**Note:** Most components should use Tailwind theme classes (`bg-primary`) instead of the `dark:` modifier. The theme classes automatically adapt to both themes.

## Theme Toggle

The theme toggle component is located at `src/components/shared/theme-toggle.tsx`.

It allows users to switch between Light and Dark modes manually. The "System" option is not available since `enableSystem` is disabled.

## Benefits

- **No JavaScript needed** - Colors adapt automatically via CSS
- **No hydration errors** - CSS handles theme switching seamlessly
- **Easy to customize** - Change colors in one place (`globals.css`)
- **Consistent** - All components use the same color system
- **Performance** - Pure CSS solution, no runtime overhead


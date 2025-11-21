# Theming

This project uses `next-themes` for theme management and Tailwind CSS for styling.

## Configuration

The theme provider is configured in `src/layouts/root-layout.tsx`.

### Default Theme

The default theme is set to **dark**. This is configured in the `ThemeProvider` component:

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

If you want to respect system preferences:
1. Set `enableSystem={true}` (or remove the prop as it defaults to true).
2. Set `defaultTheme="system"`.

## Theme Toggle

The theme toggle component is located at `src/components/shared/theme-toggle.tsx`.

It allows users to switch between Light and Dark modes manually.
Note: The "System" option has been removed since `enableSystem` is disabled.

## Tailwind Configuration

Dark mode styles are applied using the `dark:` modifier in Tailwind classes.
Example: `bg-white dark:bg-slate-900`


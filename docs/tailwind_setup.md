# Tailwind CSS Setup

This project uses Tailwind CSS for utility-first styling alongside existing CSS in `app/globals.css`.

## What we added

- Tailwind, PostCSS, Autoprefixer dev dependencies
- `@tailwindcss/postcss` (Tailwind v4 PostCSS plugin)
- `postcss.config.js` with Tailwind and Autoprefixer plugins
- `tailwind.config.js` with content paths and `darkMode: 'class'`
- Tailwind directives in `app/globals.css`

## Notes

- Tailwind Preflight (base reset) is enabled and may slightly normalize element defaults. Existing custom CSS remains and continues to apply.

## How to use

1. Start the dev server:
   - `pnpm dev`
2. Add Tailwind classes anywhere in the app, e.g. in `app/page.tsx`:

   ```tsx
   <h1 className="text-3xl font-bold text-slate-800">Hello Tailwind</h1>
   ```

3. For dark mode, wrap with a `class="dark"` on `html` or a container:

   ```html
   <html class="dark">...</html>
   ```

## Testing checklist

- Verify a utility like `p-4 bg-blue-100` changes padding and background.
- Toggle the `dark` class and confirm dark styles apply when used.
- Ensure existing pages still render correctly; adjust custom CSS if needed.

<!-- f3f469a6-a51b-4e8a-84c8-8c42f5d3f21f 93f4a9df-7b1f-4aae-ac73-c9b5151d4a95 -->
# Refactor Application with shadcn/ui and Modular Layouts

## Phase 1: Setup Foundation

### Install shadcn/ui and Dependencies

- Install `next-themes` for dark mode functionality
- Run `npx shadcn@latest init` to set up shadcn/ui with proper configuration
- Install core shadcn components: Button, Card, DropdownMenu, Input, Label, Separator

### Create Color Constants System

- Create `src/constants/colors.ts` with simple color configuration
- Define 4-5 core colors: primary, secondary, accent, background, text
- Create separate sets for light mode and dark mode
- Keep it simple - just plain objects that can be easily modified

### Update Tailwind Configuration

- Extend `tailwind.config.js` to use color constants
- Ensure proper integration with shadcn theme system
- Maintain existing backdrop blur and custom utilities

## Phase 2: Build Layout System

### Create Root Layout Structure (`src/layouts/root-layout.tsx`)

- Wrap with ThemeProvider from next-themes
- Include `suppressHydrationWarning` on html tag
- Set `attribute="class"`, `defaultTheme="system"`, `enableSystem={true}`
- Apply background colors from constants

### Create Navbar Component (`src/layouts/navbar.tsx`)

- Convert existing Navigation to use shadcn Button components
- Add dark mode toggle using shadcn DropdownMenu
- Use color constants for styling
- Keep auth-aware navigation logic

### Create Footer Component (`src/layouts/footer.tsx`)

- Simple footer with links and copyright
- Use color constants
- Dark mode aware styling

### Create Main Layout Component (`src/layouts/main-layout.tsx`)

- Combines Navbar, children slot, and Footer
- Handles consistent spacing and container widths
- Can accept optional props for customization

### Create Auth Layout (`src/layouts/auth-layout.tsx`)

- Centered container for auth pages
- Different styling from main layout
- Still includes minimal header/footer

## Phase 3: Refactor Components with shadcn

### Update UI Components to Use shadcn

- `src/components/ui/product-card.tsx` - Use shadcn Card, Button
- `src/components/ui/hero-section.tsx` - Use shadcn styling patterns
- `src/components/ui/features-section.tsx` - Use shadcn Card
- `src/components/ui/password-input.tsx` - Use shadcn Input, Label
- Apply color constants throughout
- Ensure dark mode compatibility

### Create Theme Toggle Component (`src/components/ui/theme-toggle.tsx`)

- Implement the shadcn mode toggle pattern
- Sun/Moon icons with smooth transitions
- Dropdown with Light/Dark/System options

## Phase 4: Refactor All Pages

### Update Root Layout (`app/layout.tsx`)

- Import and use new RootLayout from `src/layouts/`
- Wrap with AuthProvider
- Remove inline styling, use layout components

### Refactor Home Page (`app/page.tsx`)

- Use MainLayout structure
- Apply shadcn components
- Use color constants
- Maintain existing functionality

### Refactor Auth Pages

- `app/auth/signup/page.tsx` - Use AuthLayout, shadcn forms
- `app/auth/forgot-password/page.tsx` - Use AuthLayout
- `app/auth/reset-password/[token]/page.tsx` - Use AuthLayout
- Replace inline Tailwind with color constants
- Use shadcn Input, Button, Label components

### Refactor Products Page (`app/products/page.tsx`)

- Use MainLayout
- Update ProductCard to use shadcn Card
- Apply color constants
- Dark mode compatible

### Refactor Profile Pages

- `app/profile/page.tsx` - Use MainLayout
- `app/profile/profile-client.tsx` - Use shadcn Card, Button
- Apply color constants throughout
- Improve visual consistency

### Refactor Checkout Pages

- `app/checkout/page.tsx` - Use MainLayout
- `app/checkout/return/page.tsx` - Use MainLayout
- Use shadcn components
- Apply color constants

## Phase 5: Testing & Cleanup

### Test Dark Mode

- Verify all pages render correctly in light/dark/system modes
- Test theme toggle functionality
- Ensure color constants work properly

### Visual Consistency Check

- Verify spacing is consistent across pages
- Ensure all buttons use shadcn Button component
- Confirm color usage follows constants

### Update Exports

- Update `src/components/index.ts`
- Update `src/layouts/index.ts` (create if needed)
- Ensure all exports are clean and organized

## Key Files to Create

- `src/constants/colors.ts` - Simple color configuration
- `src/layouts/root-layout.tsx` - Theme provider wrapper
- `src/layouts/navbar.tsx` - Main navigation
- `src/layouts/footer.tsx` - Site footer
- `src/layouts/main-layout.tsx` - Standard page layout
- `src/layouts/auth-layout.tsx` - Auth pages layout
- `src/layouts/index.ts` - Layout exports
- `src/components/ui/theme-toggle.tsx` - Dark mode toggle

## Key Principles

- Keep color constants simple and easy to modify
- Use shadcn components consistently
- Maintain existing functionality while improving structure
- Make layouts composable and reusable
- Support dark mode throughout with system preference detection
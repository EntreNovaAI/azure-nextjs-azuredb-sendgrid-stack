# Components Organization

This folder contains all React components organized by category for better maintainability and developer experience.

## Folder Structure

```text
app/_components/
├── auth/           # Authentication-related components
│   ├── auth-provider.tsx    # NextAuth session provider wrapper
│   ├── login-button.tsx     # Login/logout button with Google OAuth
│   ├── user-info.tsx        # User account information display
│   └── index.ts            # Barrel exports for auth components
├── ui/             # Reusable UI components
│   ├── navigation.tsx       # Main navigation with auth-aware menu
│   ├── page-states.tsx      # Loading, auth required, and access notice components
│   ├── product-card.tsx     # Product/subscription tier display card
│   └── index.ts            # Barrel exports for UI components
├── features/       # Feature-specific components
│   ├── calculator.tsx       # Calculator with tiered functionality
│   └── index.ts            # Barrel exports for feature components
├── payment/        # Payment-related components
│   ├── stripe-checkout.tsx  # Stripe embedded checkout component
│   └── index.ts            # Barrel exports for payment components
└── index.ts        # Main barrel export for all components
```

## Usage

### Import from Category Folders

```typescript
// Import specific components from categories
import { AuthProvider, LoginButton } from '@/app/_components/auth'
import { Navigation, ProductCard } from '@/app/_components/ui'
import { Calculator } from '@/app/_components/features'
import { StripeCheckout } from '@/app/_components/payment'
```

### Import from Main Barrel

```typescript
// Import everything from main barrel (less recommended for large apps)
import { AuthProvider, Navigation, Calculator } from '@/app/_components'
```

## Component Categories

### Auth Components (`app/auth/components`)

Located in `app/auth/components` as they are specific to authentication:

- **AuthProvider**: Wraps app with NextAuth session provider
- **LoginButton**: Handles Google OAuth login/logout with user display

### UI Components (`/ui`)

- **Navigation**: Main navigation bar with auth-aware menu items
- **ProductCard**: Reusable card for displaying product/subscription tiers
- **PageStates**: Loading states, auth required messages, and access notices
- **UserInfo**: Shows user account details and access level
- **PasswordInput**: Reusable password input with visibility toggle
- **FeatureCard**: Card component for displaying feature information
- **FeaturesSection**: Section containing multiple feature cards
- **HeroSection**: Hero banner component with configurable content

### Feature Components (`/features`)

- **Calculator**: Feature-rich calculator with tiered functionality based on user access level

### Payment Components (`/payment`)

- **StripeCheckout**: Embedded Stripe checkout form following Stripe's best practices

## Benefits of This Organization

1. **Clear Separation of Concerns**: Components are grouped by their primary purpose
2. **Easy Navigation**: Developers can quickly find components by category
3. **Scalable Structure**: New components can be easily added to appropriate categories
4. **Clean Imports**: Barrel exports provide clean, organized import statements
5. **Better Maintainability**: Related components are co-located for easier maintenance

## Adding New Components

1. **Determine the Category**: Choose the most appropriate folder based on the component's primary purpose
2. **Create the Component**: Add your new component file to the chosen folder
3. **Update Barrel Exports**: Add the export to the category's `index.ts` file
4. **Update Main Barrel**: The main `index.ts` already re-exports all categories

## Migration Notes

All existing imports have been updated to use the new structure. The reorganization maintains full backward compatibility through barrel exports while providing a cleaner, more maintainable codebase structure.

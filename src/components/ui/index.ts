/**
 * UI Components Barrel Export
 * Provides clean imports for reusable UI components
 */

export { Navigation } from './navigation'
export { LoadingState, AuthRequiredState, AccessNotice } from './page-states'
export { ProductCard } from './product-card'
export { FeatureCard } from './feature-card'
export { FeaturesSection } from './features-section'
export { HeroSection, homeHeroContent, productsHeroContent, type HeroContent } from './hero-section'
export { PasswordInput } from './password-input'
export { UserInfo } from './user-info'
export { ThemeToggle } from './theme-toggle'

// Re-export shadcn components for convenience
export { Button } from './button'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'
export { Input } from './input'
export { Label } from './label'
export { Separator } from './separator'
export { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose
} from './sheet'

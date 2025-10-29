/**
 * Features Data
 * Centralized data for application features
 * Used across different pages and components
 */

export interface Feature {
  icon: string
  title: string
  description: string
}

// Homepage hero features
export const heroFeatures: Feature[] = [
  {
    icon: "🔐",
    title: "Secure Authentication",
    description: "Google OAuth integration with NextAuth.js. Secure session management and protected routes for premium content."
  },
  {
    icon: "💳", 
    title: "Stripe Integration",
    description: "Secure payment processing with Stripe. Embedded checkout, subscription management, and automated billing."
  },
  {
    icon: "📊",
    title: "Customer Management", 
    description: "Automatic customer record creation, access level management, and subscription tracking in PostgreSQL database."
  }
]

// Additional features that could be used elsewhere
export const technicalFeatures: Feature[] = [
  {
    icon: "🏗️",
    title: "Modern Stack",
    description: "Built with Next.js 14, TypeScript, Prisma ORM, and deployed on Azure with CI/CD pipelines."
  },
  {
    icon: "🚀",
    title: "Performance Optimized",
    description: "Server-side rendering, static generation, and optimized bundle sizes for fast loading times."
  },
  {
    icon: "🔒",
    title: "Enterprise Security",
    description: "Industry-standard security practices with encrypted data storage and secure API endpoints."
  }
]

/**
 * Feature Definitions
 * Single source of truth for all feature definitions and plan limits
 * 
 * This file defines all features available in the application and their
 * limits for each plan tier. Features can have boolean (enabled/disabled),
 * numeric (count limits), or 'unlimited' values.
 */

export type PlanId = 'free' | 'basic' | 'premium'

// Plan order for comparison and upgrade flows
export const planOrder: PlanId[] = ['free', 'basic', 'premium']

// Feature limit value types
export type LimitValue = boolean | number | 'unlimited'

/**
 * Feature definition interface
 * Each feature has an ID, display metadata, and limits per plan tier
 */
export interface FeatureDefinition {
  id: FeatureId
  displayName: string
  description: string
  category?: 'core' | 'collaboration' | 'data' | 'api' | 'support' | string
  limits: Record<PlanId, LimitValue>
}

/**
 * Feature ID type
 * All feature IDs must be defined here for type safety
 * Add new features by extending this union type
 */
export type FeatureId =
  | 'app_core'
  | 'team_members'
  | 'projects'
  | 'exports_csv'
  | 'api_calls'
  | 'priority_support'

/**
 * Central feature registry
 * All features are defined here with their plan limits
 * 
 * To add a new feature:
 * 1. Add the feature ID to the FeatureId type above
 * 2. Add the feature definition to FEATURES below
 * 3. The feature will automatically be available in pricing, gating, and server checks
 */
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  app_core: {
    id: 'app_core',
    displayName: 'Core App Access',
    description: 'Access to core features',
    limits: { free: true, basic: true, premium: true },
    category: 'core',
  },
  team_members: {
    id: 'team_members',
    displayName: 'Team Members',
    description: 'Seats per workspace',
    limits: { free: 1, basic: 5, premium: 20 },
    category: 'collaboration',
  },
  projects: {
    id: 'projects',
    displayName: 'Projects',
    description: 'Active projects allowed',
    limits: { free: 1, basic: 10, premium: 'unlimited' },
    category: 'core',
  },
  exports_csv: {
    id: 'exports_csv',
    displayName: 'CSV Export',
    description: 'Export data to CSV',
    limits: { free: false, basic: true, premium: true },
    category: 'data',
  },
  api_calls: {
    id: 'api_calls',
    displayName: 'Monthly API Calls',
    description: 'Usage per month',
    limits: { free: 1000, basic: 10000, premium: 'unlimited' },
    category: 'api',
  },
  priority_support: {
    id: 'priority_support',
    displayName: 'Priority Support',
    description: 'Faster response times',
    limits: { free: false, basic: false, premium: true },
    category: 'support',
  },
}


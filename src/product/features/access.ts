/**
 * Feature Access Helpers
 * Type-safe utilities for checking feature availability and limits
 * 
 * These helpers work with any PlanId and FeatureId for consistent
 * feature checking across the application (client and server).
 */

import { FEATURES, type FeatureId, type PlanId, type LimitValue } from './definitions'

/**
 * Check if a plan has access to a specific feature
 * 
 * @param plan - The user's plan tier
 * @param featureId - The feature to check
 * @returns true if feature is enabled for the plan
 * 
 * @example
 * hasFeature('free', 'app_core') // true
 * hasFeature('free', 'exports_csv') // false
 * hasFeature('basic', 'exports_csv') // true
 */
export function hasFeature(plan: PlanId, featureId: FeatureId): boolean {
  const limit = FEATURES[featureId]?.limits[plan]
  
  // Feature is enabled if:
  // - limit is explicitly true
  // - limit is a number > 0
  // - limit is 'unlimited'
  return limit === true || (typeof limit === 'number' && limit > 0) || limit === 'unlimited'
}

/**
 * Get the limit value for a feature on a specific plan
 * 
 * @param plan - The user's plan tier
 * @param featureId - The feature to check
 * @returns The limit value (boolean, number, or 'unlimited')
 * 
 * @example
 * getFeatureLimit('free', 'team_members') // 1
 * getFeatureLimit('premium', 'projects') // 'unlimited'
 * getFeatureLimit('free', 'exports_csv') // false
 */
export function getFeatureLimit(plan: PlanId, featureId: FeatureId): LimitValue {
  return FEATURES[featureId]?.limits[plan]
}

/**
 * Get all feature IDs that are enabled for a plan
 * 
 * @param plan - The user's plan tier
 * @returns Array of enabled feature IDs
 * 
 * @example
 * listEnabledFeatures('free') // ['app_core', 'team_members', 'projects', 'api_calls']
 */
export function listEnabledFeatures(plan: PlanId): FeatureId[] {
  return (Object.keys(FEATURES) as FeatureId[]).filter((id) => hasFeature(plan, id))
}

/**
 * Compare two plans to determine upgrade/downgrade direction
 * 
 * @param planA - First plan
 * @param planB - Second plan
 * @returns Negative if A < B, positive if A > B, 0 if equal
 * 
 * @example
 * comparePlans('free', 'premium') // negative (free < premium)
 * comparePlans('premium', 'basic') // positive (premium > basic)
 */
export function comparePlans(planA: PlanId, planB: PlanId): number {
  const order = ['free', 'basic', 'premium']
  return order.indexOf(planA) - order.indexOf(planB)
}


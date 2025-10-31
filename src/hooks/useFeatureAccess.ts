/**
 * useFeatureAccess Hook
 * React hook for accessing feature entitlements on the client
 * 
 * This hook reads the user's plan from the session and provides
 * helpers to check feature availability and limits.
 */

'use client'

import { useSession } from 'next-auth/react'
import { hasFeature, getFeatureLimit } from '@/src/product/features/access'
import type { FeatureId, PlanId } from '@/src/product/features/definitions'

/**
 * Hook return type
 */
interface UseFeatureAccessReturn {
  plan: PlanId
  hasFeature: (featureId: FeatureId) => boolean
  getFeatureLimit: (featureId: FeatureId) => boolean | number | 'unlimited' | undefined
}

/**
 * Get feature access helpers for the current user
 * 
 * @param planOverride - Optional plan override (useful for testing or previews)
 * @returns Object with plan and feature checking helpers
 * 
 * @example
 * const { plan, hasFeature, getFeatureLimit } = useFeatureAccess()
 * 
 * if (hasFeature('exports_csv')) {
 *   // Show export button
 * }
 * 
 * const teamLimit = getFeatureLimit('team_members') // e.g., 5
 */
export function useFeatureAccess(planOverride?: PlanId): UseFeatureAccessReturn {
  const { data: session } = useSession()
  
  // Use override if provided, otherwise get from session, default to 'free'
  const plan: PlanId = planOverride ?? ((session?.user?.accessLevel as PlanId) ?? 'free')
  
  return {
    plan,
    hasFeature: (id: FeatureId) => hasFeature(plan, id),
    getFeatureLimit: (id: FeatureId) => getFeatureLimit(plan, id),
  }
}


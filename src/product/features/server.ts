/**
 * Server-Side Feature Guards
 * Server-only utilities for enforcing feature access in API routes and server actions
 * 
 * IMPORTANT: Server checks are authoritative. Client checks are for UX only.
 * Always use server guards for any sensitive operations or data access.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { hasFeature } from './access'
import type { FeatureId, PlanId } from './definitions'

/**
 * Require a feature to be available for the current user's plan
 * 
 * Use this in API routes and server actions to enforce feature access.
 * Returns a 403 response if the feature is not available.
 * 
 * @param featureId - The feature ID to check
 * @returns NextResponse with 403 error if feature unavailable, null if available
 * 
 * @example
 * // In an API route:
 * export async function GET() {
 *   const forbidden = await requireFeature('api_calls')
 *   if (forbidden) return forbidden
 *   
 *   // Feature is available, proceed with logic
 * }
 */
export async function requireFeature(
  featureId: FeatureId
): Promise<NextResponse | null> {
  // Get the current session (NextAuth automatically uses the configured authOptions)
  const session = await getServerSession()
  const plan = (session?.user?.accessLevel ?? 'free') as PlanId
  
  // Check if the user's plan has access to this feature
  if (!hasFeature(plan, featureId)) {
    return NextResponse.json(
      { error: 'Feature not available on your plan' },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Check if current user has access to a feature (without returning error response)
 * 
 * Useful when you need to conditionally execute logic but handle the
 * error yourself.
 * 
 * @param featureId - The feature ID to check
 * @returns Object with hasAccess boolean and plan
 * 
 * @example
 * const { hasAccess, plan } = await checkFeatureAccess('exports_csv')
 * if (!hasAccess) {
 *   // Handle unauthorized access
 * }
 */
export async function checkFeatureAccess(
  featureId: FeatureId
): Promise<{
  hasAccess: boolean
  plan: PlanId
}> {
  // Get the current session (NextAuth automatically uses the configured authOptions)
  const session = await getServerSession()
  const plan = (session?.user?.accessLevel ?? 'free') as PlanId
  
  return {
    hasAccess: hasFeature(plan, featureId),
    plan,
  }
}


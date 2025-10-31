/**
 * FeatureGate Component
 * Reusable component for conditionally rendering features based on plan access
 * 
 * Use this component to wrap features that should only be visible/enabled
 * for certain plan tiers. Shows fallback content (or upgrade prompt) when
 * feature is not available.
 */

'use client'

import { ReactNode } from 'react'
import { useFeatureAccess } from '@/src/hooks/useFeatureAccess'
import type { FeatureId } from '@/src/product/features/definitions'

interface FeatureGateProps {
  /**
   * Feature ID to check access for
   */
  featureId: FeatureId
  
  /**
   * Content to render when feature is available
   */
  children: ReactNode
  
  /**
   * Optional fallback content to show when feature is unavailable
   * If not provided, nothing is rendered
   */
  fallback?: ReactNode
  
  /**
   * Optional plan override (useful for testing or previews)
   */
  planOverride?: 'free' | 'basic' | 'premium'
}

/**
 * FeatureGate component
 * 
 * @example
 * <FeatureGate featureId="exports_csv">
 *   <ExportButton />
 * </FeatureGate>
 * 
 * @example
 * <FeatureGate 
 *   featureId="priority_support"
 *   fallback={<UpgradePrompt />}
 * >
 *   <PrioritySupportButton />
 * </FeatureGate>
 */
export function FeatureGate({ 
  featureId, 
  children, 
  fallback,
  planOverride 
}: FeatureGateProps) {
  const { hasFeature } = useFeatureAccess(planOverride)
  
  if (hasFeature(featureId)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}


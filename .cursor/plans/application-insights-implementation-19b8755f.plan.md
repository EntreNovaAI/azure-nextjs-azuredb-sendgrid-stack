<!-- 19b8755f-be84-436d-a060-f4d7919f76c0 54e6ce5a-6646-44a5-990f-c1fe4aea4838 -->
# Application Insights Implementation Plan

## Overview

Implement Application Insights for comprehensive monitoring and analytics, following existing Azure service patterns (lazy initialization, environment-based configuration). Separate infrastructure monitoring from business analytics for better maintainability.

## Architecture Decisions

### 1. Directory Structure

- `src/lib/azure/application-insights/` - Infrastructure monitoring (errors, performance, Web Vitals)
- `src/lib/analytics/` - Business analytics (conversion funnel, user events)
- `src/components/monitoring/` - Client-side React components

### 2. Environment Variables

- Standardize on `APPLICATIONINSIGHTS_CONNECTION_STRING` (matches Azure convention, already in container-app.bicep)
- Client needs: `NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY` (build-time)
- Toggle: `ENABLE_APPLICATION_INSIGHTS=true/false` (optional, defaults to checking if connection string exists)

### 3. Initialization Patterns

- **Server**: Lazy singleton pattern (like `src/lib/kysely/client.ts`)
- **Client**: Provider component pattern with conditional rendering
- **Graceful fallback**: Return null/no-op when not configured

## Implementation Phases

### Phase 1: Environment & Infrastructure Configuration

**Update environment variable generation:**

- Update `scripts/deploy/01_deploy_infrastructure/lib/06_env_generation.sh` line 220: Change `APPINSIGHTS_CONNECTION_STRING` to `APPLICATIONINSIGHTS_CONNECTION_STRING` to match Azure convention
- Add `NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY` extraction from monitoring outputs
- Update `.env.example` with both variables and documentation

**Update Bicep outputs:**

- `infrastructure/bicep/modules/monitoring.bicep` already outputs instrumentation key (line 69) ✓
- `infrastructure/bicep/modules/container-app.bicep` already uses `APPLICATIONINSIGHTS_CONNECTION_STRING` (line 127) ✓
- Add instrumentation key as environment variable in container-app.bicep for client-side use

### Phase 2: Server-Side Monitoring

**Install dependencies:**

- `@microsoft/applicationinsights` (server SDK)

**Create server monitoring module:**

- `src/lib/azure/application-insights/server.ts` - Lazy initialization singleton following `src/lib/kysely/client.ts` pattern
  - Check `ENABLE_APPLICATION_INSIGHTS` or presence of `APPLICATIONINSIGHTS_CONNECTION_STRING`
  - Initialize once, reuse singleton
  - Export `getAppInsights()` function that returns null if not configured
  - Track: errors, exceptions, dependencies (DB queries), requests (API routes)

- `src/lib/azure/application-insights/performance.ts` - Performance tracking helpers
  - API route timing wrapper
  - Database query timing (if possible via Kysely hooks)
  - Stripe webhook processing time tracking

**Integrate with existing code:**

- Update `app/error.tsx` - Track client-side errors (when client SDK available)
- Create API route wrapper/middleware pattern for automatic error tracking
- Update `app/(api)/api/stripe/webhooks/route.ts` - Track webhook processing time
- Update `app/(api)/api/health/route.ts` - Track health check calls
- Update `app/(api)/api/auth/[...nextauth]/route.ts` - Track auth errors

### Phase 3: Client-Side Monitoring

**Install dependencies:**

- `@microsoft/applicationinsights-web` (client SDK)

**Create client monitoring module:**

- `src/lib/azure/application-insights/client.ts` - Client initialization helper
  - Check for `NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY`
  - Export initialization function
  - Configure automatic page view tracking
  - Configure Web Vitals tracking

- `src/components/monitoring/app-insights-provider.tsx` - Client component wrapper
  - 'use client' directive
  - Initialize in useEffect (only once)
  - Wrap children (pass-through)
  - Conditional initialization based on environment variables

**Integrate in layout:**

- Update `app/layout.tsx` - Wrap children with `<AppInsightsProvider>` conditionally (production only)
- Update `app/error.tsx` - Track errors to Application Insights when client SDK available

**Web Vitals integration:**

- Use Next.js built-in Web Vitals support
- Create `src/lib/azure/application-insights/web-vitals.ts` - Web Vitals reporter

### Phase 4: Analytics Event System

**Create analytics module:**

- `src/lib/analytics/events.ts` - Type definitions for business events
  - Signup events (email vs Google OAuth)
  - Login events
  - Checkout started/completed events
  - Subscription events (created, updated, cancelled)
  - No PII (user IDs only, no emails)

- `src/lib/analytics/tracker.ts` - Typed event tracking functions
  - `trackSignup(method: 'email' | 'google')`
  - `trackLogin(method: 'email' | 'google')`
  - `trackCheckoutStarted(productId: string)`
  - `trackCheckoutCompleted(productId: string, amount: number)`
  - `trackSubscriptionCreated(planId: string)`
  - Server and client implementations

- `src/lib/analytics/funnel.ts` - Conversion funnel helpers
  - Track funnel stages: signup → login → checkout → subscription
  - Calculate conversion rates

**Integrate analytics tracking:**

- `app/auth/signup/page.tsx` - Track signup events (lines 38-289)
- `app/(api)/api/auth/[...nextauth]/route.ts` - Track login events (line 35-77)
- `app/checkout/page.tsx` - Track checkout started (line 14-41)
- `app/checkout/components/stripe-checkout.tsx` - Track checkout completed (line 20-57)
- `src/lib/stripe/stripe-service.ts` - Track subscription events in webhook handler

### Phase 5: Documentation

**Create monitoring documentation:**

- `docs/MONITORING.md` - Architecture, usage patterns, integration examples
- Update `docs/DEPLOYMENT.md` - Application Insights setup steps
- Update `docs/INFRASTRUCTURE.md` - Monitoring configuration details
- Add inline comments throughout code explaining patterns

## Key Implementation Patterns

### Server Lazy Initialization

```typescript
// src/lib/azure/application-insights/server.ts
let appInsightsInstance: ApplicationInsights | null = null

export function getAppInsights() {
  if (!isEnabled()) return null
  if (appInsightsInstance) return appInsightsInstance
  // Initialize...
}
```

### Client Provider Pattern

```typescript
// src/components/monitoring/app-insights-provider.tsx
'use client'
export function AppInsightsProvider({ children }) {
  useEffect(() => {
    if (shouldInitialize()) {
      initializeAppInsights()
    }
  }, [])
  return <>{children}</>
}
```

### Environment-Based Toggle

```typescript
const isEnabled = process.env.ENABLE_APPLICATION_INSIGHTS === 'true' 
  || !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
```

## Files to Create

- `src/lib/azure/application-insights/server.ts`
- `src/lib/azure/application-insights/client.ts`
- `src/lib/azure/application-insights/performance.ts`
- `src/lib/azure/application-insights/web-vitals.ts`
- `src/lib/azure/application-insights/index.ts`
- `src/lib/analytics/events.ts`
- `src/lib/analytics/tracker.ts`
- `src/lib/analytics/funnel.ts`
- `src/lib/analytics/index.ts`
- `src/components/monitoring/app-insights-provider.tsx`
- `docs/MONITORING.md`

## Files to Update

- `scripts/deploy/01_deploy_infrastructure/lib/06_env_generation.sh` (line 220: rename env var)
- `infrastructure/bicep/modules/container-app.bicep` (add instrumentation key env var)
- `app/layout.tsx` (wrap with AppInsightsProvider)
- `app/error.tsx` (track errors)
- `app/(api)/api/stripe/webhooks/route.ts` (track processing time)
- `app/(api)/api/health/route.ts` (track health checks)
- `app/(api)/api/auth/[...nextauth]/route.ts` (track auth errors)
- `app/auth/signup/page.tsx` (track signup events)
- `app/checkout/page.tsx` (track checkout started)
- `app/checkout/components/stripe-checkout.tsx` (track checkout completed)
- `src/lib/stripe/stripe-service.ts` (track subscription events)
- `.env.example` (add Application Insights variables)
- `docs/DEPLOYMENT.md` (setup steps)
- `docs/INFRASTRUCTURE.md` (monitoring details)
- `package.json` (add dependencies)

## Dependencies to Add

```json
{
  "@microsoft/applicationinsights": "^2.x",
  "@microsoft/applicationinsights-web": "^3.x"
}
```

## Testing Checklist

- [ ] Server SDK initializes only when connection string present
- [ ] Client SDK initializes only when instrumentation key present
- [ ] Errors tracked from error.tsx
- [ ] API route errors tracked automatically
- [ ] Web Vitals tracked correctly
- [ ] Page views tracked automatically
- [ ] Signup events tracked
- [ ] Login events tracked
- [ ] Checkout events tracked
- [ ] Subscription events tracked
- [ ] Graceful fallback when not configured
- [ ] No errors in development when disabled

### To-dos

- [ ] Update environment variable generation script to use APPLICATIONINSIGHTS_CONNECTION_STRING and extract instrumentation key
- [ ] Add NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY to container-app.bicep environment variables
- [ ] Install @microsoft/applicationinsights package
- [ ] Create src/lib/azure/application-insights/server.ts with lazy initialization pattern
- [ ] Create src/lib/azure/application-insights/performance.ts for API route and DB query tracking
- [ ] Install @microsoft/applicationinsights-web package
- [ ] Create src/lib/azure/application-insights/client.ts with initialization helper
- [ ] Create src/components/monitoring/app-insights-provider.tsx client component wrapper
- [ ] Create src/lib/azure/application-insights/web-vitals.ts for Core Web Vitals tracking
- [ ] Create src/lib/analytics/events.ts with type definitions for business events
- [ ] Create src/lib/analytics/tracker.ts with typed tracking functions
- [ ] Create src/lib/analytics/funnel.ts for conversion funnel tracking
- [ ] Integrate AppInsightsProvider in app/layout.tsx with conditional rendering
- [ ] Update app/error.tsx to track client-side errors
- [ ] Create API route wrapper/middleware for automatic server error tracking
- [ ] Add performance tracking to Stripe webhook handler
- [ ] Add signup event tracking to app/auth/signup/page.tsx
- [ ] Add login event tracking to auth route handler
- [ ] Add checkout event tracking to checkout page and component
- [ ] Add subscription event tracking to Stripe webhook handler
- [ ] Create docs/MONITORING.md and update deployment/infrastructure docs
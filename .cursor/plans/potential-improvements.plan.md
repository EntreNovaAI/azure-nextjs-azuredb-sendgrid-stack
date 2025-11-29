# Complete SaaS Template Enhancement Plan

## Overview

Production-ready enhancements focusing on security, performance, monitoring, and user experience. Use Azure-native services, implement PWA capabilities, and ensure GDPR compliance.

## Phase 1: Critical Security & Headers

**Goal**: Production-ready security hardening

### 1.1 Security Headers Middleware

- Create `middleware.ts` with security headers:
  - CSP (allow Application Insights, Stripe)
  - X-Frame-Options, X-Content-Type-Options
  - Referrer-Policy, Permissions-Policy
  - Strict-Transport-Security

### 1.2 Rate Limiting Enhancement

- Extend to auth endpoints, password reset, all APIs
- Create `src/lib/security/rate-limiter.ts`
- Add X-RateLimit-* headers

### 1.3 Input Sanitization

- Install `dompurify` and `isomorphic-dompurify`
- Create `src/lib/security/sanitize.ts`
- Sanitize user names, profile data

### 1.4 Environment Variable Validation

- Create `src/lib/config/env-validator.ts`
- Validate on startup, fail fast with clear errors

## Phase 2: Application Insights (Analytics + Monitoring)

**Goal**: Comprehensive analytics and error tracking

### 2.1 Client Integration

- Install `@microsoft/applicationinsights-web`
- Create `src/lib/monitoring/app-insights-client.ts`
- Track: page views, events, errors, Web Vitals, sessions

### 2.2 Server Integration

- Install `@microsoft/applicationinsights`
- Create `src/lib/monitoring/app-insights-server.ts`
- Log: API errors, webhooks, database failures, Stripe ops

### 2.3 Analytics Event System

- Create `src/lib/analytics/events.ts` with typed events
- Track conversion funnel (signup→login→checkout→subscription)
- No cookie consent needed (first-party Azure)

### 2.4 Performance & Alerts

- Track Core Web Vitals, API times, DB queries
- Document alert setup in Azure (errors, payments, slowness)

## Phase 3: Service Worker & PWA

**Goal**: Offline support and PWA capabilities

### 3.1 Service Worker Implementation

- Create `public/sw.js` with caching strategy:
  - Cache static assets (CSS, JS, images)
  - Cache API responses with TTL
  - Offline fallback page
- Cache Stripe pricing (short TTL)

### 3.2 PWA Manifest

- Create `app/manifest.json/route.ts`
- Add PWA meta tags to `app/layout.tsx`
- Configure icons, theme colors, display mode
- Make app installable on mobile

### 3.3 Offline Experience

- Create offline fallback page
- Show offline indicator
- Queue actions when offline (optional)

## Phase 4: Lazy Loading & Performance

**Goal**: Fast loading and optimized bundles

### 4.1 Image Optimization

- Configure `next.config.js` for images:
  - WebP/AVIF formats
  - Responsive sizes
  - Local images in `/public`
- Document Next.js Image component usage
- Add loading skeletons

### 4.2 Component Lazy Loading

- Use `next/dynamic` for:
  - Testimonials (below fold)
  - FAQ (below fold)
  - Stripe checkout
  - Dashboard heavy components
- Add loading states

### 4.3 Code Splitting

- Analyze bundle size
- Split vendor chunks
- Tree-shake unused dependencies
- Document bundle optimization

## Phase 5: Enhanced Health Check & Observability

**Goal**: Comprehensive health monitoring

### 5.1 Enhanced Health Check

- Update `app/api/health/route.ts`:
  - Check database connectivity
  - Check Stripe API status
  - Return detailed status

### 5.2 Graceful Degradation

- Error boundaries for third-party services
- Don't break app if monitoring fails
- Handle Stripe/DB failures gracefully

## Phase 6: SEO & Discoverability

**Goal**: Search engine optimization

### 6.1 Metadata & Sitemaps

- Create `app/sitemap.ts` (dynamic)
- Create `app/robots.txt/route.ts`
- Update `app/layout.tsx`: Open Graph, Twitter Cards, canonical URLs
- Create `src/lib/seo/metadata.ts`

### 6.2 Structured Data

- Add Schema.org: Organization, Product, WebApplication
- Create `src/lib/seo/structured-data.ts`

## Phase 7: Email Verification

**Goal**: Prevent fake accounts and spam

### 7.1 Email Verification Flow

- Add verification tokens table (migration)
- Generate tokens on signup
- Send verification email via MailerSend
- Create `app/auth/verify-email/[token]/page.tsx`
- Add verification status to user model
- Require verification for paid features
- Add resend verification option

## Phase 8: Session Security

**Goal**: Enhanced authentication security

### 8.1 Session Configuration

- Configure NextAuth session timeout
- Implement refresh tokens
- Add "Remember me" option
- Force re-auth for sensitive ops (payment changes, email changes)

### 8.2 API Security

- Add CORS configuration
- Request/response size limits
- Timeout configuration for external calls
- Request logging middleware

## Phase 9: Database Security

**Goal**: Robust database handling

### 9.1 Connection Pool Configuration

- Configure Kysely limits:
  - Max connections: 20, Min: 2
  - Idle timeout: 30s, Acquire timeout: 30s
- Add connection retry logic
- Query timeout configuration

## Phase 10: GDPR Compliance

**Goal**: User privacy and data control

### 10.1 Cookie Policy

- Update `app/(legal)/privacy/page.tsx`
- Document Application Insights (first-party, no banner needed)
- Data retention policy

### 10.2 Data Management APIs

- Create `app/api/user/export/route.ts` - export all user data
- Create `app/api/user/delete/route.ts` - right to be forgotten
- Add to profile page

## Phase 11: User Experience

**Goal**: Polish and engagement

### 11.1 Toast Notifications

- Create `src/components/shared/toast.tsx` (Radix)
- Success, error, info messages
- Add to root layout

### 11.2 Loading States

- Create `src/components/shared/loading-states.tsx`
- Add to checkout, forms, async operations
- Use Suspense boundaries

### 11.3 Social Proof

- Create `src/components/sections/testimonials-section.tsx`
- Create `src/components/sections/faq-section.tsx`
- Add to landing page

### 11.4 Enhanced Pricing

- "Most Popular" badge
- Feature comparison tooltips
- Mobile responsive
- Annual/monthly toggle UI

### 11.5 Notifications (Web PubSub)

- Create `src/lib/notifications/notification-service.ts`
- Create `src/components/shared/notification-center.tsx`
- Wire to existing Web PubSub
- Add navbar icon

### 11.6 Footer Enhancement

- Links to legal pages
- Social media placeholders

## Phase 12: Accessibility

**Goal**: WCAG compliance

### 12.1 Accessibility Improvements

- ARIA labels on interactive elements
- Keyboard navigation (tab order, focus, skip link)
- Screen reader announcements
- Alt text on all images
- Test with axe DevTools

### 12.2 Form Enhancements

- Inline validation feedback
- Password strength indicator
- Improved error messages
- Success confirmations
- Prevent double submission

### 12.3 Mobile Optimization

- Touch targets 44x44px minimum
- Optimize mobile navigation
- Test various screen sizes
- Mobile-optimized checkout

## Phase 13: Deployment & Dev Scripts

**Goal**: Automated configuration

### 13.1 Deployment Scripts

- Modify `scripts/deploy/01_deploy_infrastructure.sh`:
  - Extract Application Insights connection string
  - Auto-populate `.env.production`
- Update `scripts/deploy/README.md`

### 13.2 Development Scripts

- Modify `scripts/dev/00_init_setup.sh` - optional AI setup
- Create `scripts/dev/02_appinsights_setup.sh` - interactive setup
- Update `scripts/dev/README.md`

### 13.3 Environment Configuration

- Update `.env.example`:
  - Group by category
  - Required vs optional
  - Detailed comments
  - Format examples

## Phase 14: Documentation

**Goal**: Comprehensive docs

### 14.1 README Updates

- Security features
- Application Insights
- Service Worker & offline
- Lazy loading
- Email verification
- Accessibility

### 14.2 Security Documentation

- Create `SECURITY.md`:
  - Features implemented
  - Vulnerability reporting
  - Security headers
  - Rate limiting

### 14.3 Performance Documentation

- Image optimization guide
- Lazy loading patterns
- Service worker caching
- Bundle optimization

## Files to Create

- `middleware.ts`
- `SECURITY.md`
- `public/sw.js`
- `app/manifest.json/route.ts`
- `app/sitemap.ts`
- `app/robots.txt/route.ts`
- `app/auth/verify-email/[token]/page.tsx`
- `app/api/user/export/route.ts`
- `app/api/user/delete/route.ts`
- `src/lib/config/env-validator.ts`
- `src/lib/security/rate-limiter.ts`
- `src/lib/security/sanitize.ts`
- `src/lib/seo/metadata.ts`
- `src/lib/seo/structured-data.ts`
- `src/lib/monitoring/app-insights-client.ts`
- `src/lib/monitoring/app-insights-server.ts`
- `src/lib/analytics/events.ts`
- `src/lib/notifications/notification-service.ts`
- `src/components/shared/toast.tsx`
- `src/components/shared/loading-states.tsx`
- `src/components/shared/notification-center.tsx`
- `src/components/sections/testimonials-section.tsx`
- `src/components/sections/faq-section.tsx`
- `scripts/dev/02_appinsights_setup.sh`
- `kysely/migrations/files/YYYY-MM-DD_add-email-verification.ts`

## Files to Update

- `app/layout.tsx` - Metadata, AI, PWA, validation
- `app/error.tsx` - AI logging
- `app/api/health/route.ts` - Enhanced checks
- `app/(marketing)/landing-page/page.tsx` - FAQ, testimonials
- `app/(legal)/privacy/page.tsx` - Data policy
- `app/profile/page.tsx` - Export/delete
- `next.config.js` - Image optimization
- `src/layouts/footer.tsx` - Links
- `src/layouts/navbar.tsx` - Notifications
- `package.json` - Dependencies
- `.env.example` - Comprehensive
- `README.md` - Features
- `scripts/deploy/01_deploy_infrastructure.sh`
- `scripts/deploy/README.md`
- `scripts/dev/00_init_setup.sh`
- `scripts/dev/README.md`

## New Dependencies

```json
{
  "@microsoft/applicationinsights-web": "^3.x",
  "@microsoft/applicationinsights": "^2.x",
  "dompurify": "^3.x",
  "isomorphic-dompurify": "^2.x"
}
```

## Environment Variables

```bash
# Monitoring (auto-populated in production)
NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx

# Security
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Email Verification
EMAIL_VERIFICATION_REQUIRED=false  # Enable when ready
```

## Testing Checklist

- [ ] Security headers (securityheaders.com)
- [ ] Rate limiting on auth
- [ ] Input sanitization works
- [ ] Env validation fails correctly
- [ ] AI tracks events & errors
- [ ] Service worker caches assets
- [ ] PWA installable on mobile
- [ ] Images lazy load
- [ ] Components lazy load
- [ ] Health check comprehensive
- [ ] Sitemap & robots.txt work
- [ ] Email verification flow
- [ ] Data export/delete APIs
- [ ] Toast notifications
- [ ] Loading states
- [ ] Accessibility (keyboard, screen reader)
- [ ] Mobile optimization
- [ ] Deployment script works

## Success Metrics

1. A+ security rating (securityheaders.com)
2. Lighthouse score 90+ (performance, accessibility, SEO)
3. Core Web Vitals pass
4. Offline functionality works
5. Email verification reduces spam
6. Application Insights tracking all events
7. GDPR compliant
8. Production deploy < 15 minutes
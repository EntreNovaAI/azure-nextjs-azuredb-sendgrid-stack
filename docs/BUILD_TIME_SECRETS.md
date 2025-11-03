# Build-Time Secrets Strategy

## The Problem

When building a Docker image for Azure Container Apps, Next.js attempts to statically analyze and pre-render pages during the build phase. This causes module-level code to execute, which fails when that code tries to access environment variables that don't exist yet (because secrets are injected at runtime from Azure Key Vault in step 6).

## The Solution

We use a **two-pronged approach** to handle this:

### 1. Lazy Initialization for Service Clients

All service clients that require secrets use **lazy initialization** - they don't validate or use environment variables until the service is actually called at runtime.

**Files using lazy initialization:**
- `src/lib/stripe/stripe-client.ts` - Stripe client
- `src/lib/kysely/client.ts` - Database client
- `src/lib/azure/storage.ts` - Blob storage client
- `src/lib/azure/webpubsub.ts` - Web PubSub client
- `src/lib/mailersend/index.ts` - Email service

**Pattern:**
```typescript
// ❌ BAD: Validates at module import time
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('Missing API_KEY')
export const client = new Client(apiKey)

// ✅ GOOD: Validates at runtime when called
let clientInstance: Client | null = null

export function getClient() {
  if (!clientInstance) {
    const apiKey = process.env.API_KEY
    if (!apiKey) throw new Error('Missing API_KEY')
    clientInstance = new Client(apiKey)
  }
  return clientInstance
}
```

### 2. Force Dynamic Rendering for Routes

For API routes and pages that use these services, we explicitly tell Next.js to skip static analysis during build by adding `export const dynamic = 'force-dynamic'`.

**Routes configured for dynamic rendering:**
- `app/api/auth/[...nextauth]/route.ts` - NextAuth (accesses database)
- `app/api/stripe/webhooks/route.ts` - Stripe webhooks
- `app/profile/page.tsx` - Profile page (accesses database)

**Pattern:**
```typescript
// Add this at the top of any route that needs runtime secrets
export const dynamic = 'force-dynamic'
```

## How It Works in Production

### Deployment Flow:
1. **Step 1-3**: Deploy infrastructure, assign roles, configure Stripe
2. **Step 4**: Build Docker image
   - Next.js builds without accessing secrets
   - Routes with `dynamic = 'force-dynamic'` are skipped in static analysis
   - Service clients with lazy initialization don't throw errors
3. **Step 5**: Push image to ACR
4. **Step 6**: Bind secrets from `.env.production` to Azure Key Vault
   - All secrets are stored in Key Vault
   - Container App is configured to inject them as environment variables
5. **Step 7**: Runtime
   - Container starts with secrets injected from Key Vault
   - Lazy-initialized services access secrets on first use
   - Everything works correctly

### Development Flow:
- Secrets are in `.env.local` or `.env`
- Services read from `process.env` directly
- No Key Vault involved

## When to Use Each Approach

### Use Lazy Initialization When:
- Creating a reusable service/client
- The service requires secrets to initialize
- The service might not be used in all routes

### Use `dynamic = 'force-dynamic'` When:
- A route/page imports modules that might access secrets
- You see build errors about missing environment variables
- The route needs runtime data anyway (like user sessions)

## Troubleshooting

### Error: "Missing required environment variable: X"
**During build**: Add `export const dynamic = 'force-dynamic'` to the route
**At runtime**: Ensure the secret is in Key Vault (step 6) or `.env.local` (dev)

### Error: "Failed to collect page data for /some/route"
This means Next.js is trying to pre-render the route during build. Add `export const dynamic = 'force-dynamic'` to that route.

## Best Practices

1. **Never validate secrets at module top-level** - Always validate inside functions
2. **Use lazy initialization** for all service clients that need secrets
3. **Add `dynamic = 'force-dynamic'`** to routes that use those services
4. **Document why** you're using lazy initialization or dynamic rendering
5. **Test the build locally** without secrets to catch issues early

## Environment Variable Types

### Public Variables (Available at Build Time)
- Prefix: `NEXT_PUBLIC_*`
- Example: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- These are embedded in the client-side bundle
- Safe to access at module level

### Secret Variables (Only at Runtime)
- No prefix
- Example: `STRIPE_SECRET_KEY`, `MSSQL_PASSWORD`
- Injected at runtime in production (from Key Vault)
- Must use lazy initialization or dynamic rendering

## Related Documentation
- [Next.js Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Azure Container Apps Secrets](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets)
- [Deployment Guide](../scripts/deploy/README.md)


# Stripe Integration

This folder contains all Stripe-related code for the application.

## Files

- **`stripe-client.ts`** - Centralized Stripe configuration (SINGLE SOURCE OF TRUTH)
- **`stripe-service.ts`** - Business logic for checkout, subscriptions, webhooks
- **`stripe-utils.ts`** - Helper functions and utilities

## 🔧 Stripe API Version Management

### Problem
Stripe regularly updates their API versions. If you pin a specific version in your code, TypeScript will eventually complain when Stripe releases newer versions, breaking your builds.

### Solution
We use the **account default API version** approach instead of pinning versions in code.

### How It Works

1. **No version specified in code** - `stripe-client.ts` doesn't specify an `apiVersion`
2. **Uses Stripe Dashboard setting** - The API version is controlled from your Stripe Dashboard
3. **Update on your schedule** - You decide when to upgrade, not TypeScript

### Upgrading Stripe API Version

When you're ready to upgrade:

1. **Test in development first**
   - Go to Stripe Dashboard > Developers > API version
   - Check the changelog for breaking changes
   
2. **Upgrade in Dashboard**
   - Click "Upgrade available version" 
   - Test your integration thoroughly
   
3. **No code changes needed**
   - The app automatically uses the new version
   - No TypeScript errors, no redeployment required

### Benefits

✅ **No build failures** - TypeScript won't complain about version mismatches  
✅ **Controlled upgrades** - Update when you're ready, not when Stripe releases  
✅ **Single source of truth** - All Stripe instances use the same configuration  
✅ **Easy testing** - Test new versions in Stripe's test mode first  

## 📝 Usage

### In API Routes or Server Components

```typescript
import { stripe } from '@lib/stripe/stripe-client'

// Use the shared instance
const session = await stripe.checkout.sessions.create({ ... })
```

### In Webhooks

```typescript
import { getStripeForWebhooks } from '@lib/stripe/stripe-client'

// Get a fresh instance for webhook verification
const stripe = getStripeForWebhooks()
const event = stripe.webhooks.constructEvent(...)
```

### In Business Logic

```typescript
import { 
  createCheckoutSession, 
  cancelSubscription,
  getSessionStatus 
} from '@lib/stripe/stripe-service'

// Use the service functions
const result = await createCheckoutSession(productId, userEmail)
```

## 🚨 Important Rules

1. **Never create new Stripe instances** - Always import from `stripe-client.ts`
2. **Never specify apiVersion** - Let the account default handle it
3. **Test upgrades first** - Use Stripe test mode before upgrading production
4. **Check changelog** - Review breaking changes before upgrading versions

## 🔗 Stripe Dashboard Links

- **API Version Settings**: Dashboard > Developers > API version
- **Webhooks**: Dashboard > Developers > Webhooks
- **API Keys**: Dashboard > Developers > API keys

## 📚 More Information

- [Stripe API Versioning Docs](https://stripe.com/docs/api/versioning)
- [Upgrading API Versions](https://stripe.com/docs/upgrades)


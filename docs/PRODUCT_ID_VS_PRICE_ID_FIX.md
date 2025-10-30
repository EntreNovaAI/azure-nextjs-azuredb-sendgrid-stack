# Product ID vs Price ID Fix

## Problem

Users were completing Stripe checkout successfully, but their access level wasn't being updated in the database. The payment went through, but the user remained on the "free" plan.

### Root Cause

The system was configured to use **product IDs** (`prod_xxx`) in environment variables, but the code was trying to match **price IDs** (`price_xxx`) from completed purchases. These never matched, so the access level defaulted to "free".

**Example from logs:**
- Environment variable: `STRIPE_SUBSCRIPTION_ID_BASIC=prod_T39h3WRmuzvZiC`
- Stripe checkout returned: `price_1S73OLFFXCDWq7wscEIc3Xz0`
- Comparison: `prod_T39h3WRmuzvZiC !== price_1S73OLFFXCDWq7wscEIc3Xz0` ❌

## Why Use Product IDs Instead of Price IDs?

**Product IDs are stable** - they don't change when you update pricing.

**Price IDs change** - every time you modify a price (e.g., $9.99 → $10.99), Stripe creates a new price ID. This would break the matching logic and require code changes.

### Benefits:
1. ✅ **Future-proof**: Update prices in Stripe Dashboard without touching code
2. ✅ **Simpler config**: One stable ID per product
3. ✅ **Automatic price fetching**: System fetches current active price for display
4. ✅ **Reliable matching**: Product IDs never change

## Solution

Changed the matching logic throughout the codebase to use **product IDs** instead of **price IDs**.

### Files Modified

1. **`src/lib/stripe/stripe-utils.ts`**
   - Updated `determineAccessLevelFromLineItems()` to extract and match product IDs
   - Added logic to handle product ID as both string and object
   - Improved logging for debugging

2. **`src/lib/user/user-service.ts`**
   - Updated `updateUserAccessLevel()` to pass product IDs to matching function
   - Added clarifying comments

3. **`src/lib/stripe/stripe-service.ts`**
   - Updated webhook handlers: `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_succeeded`
   - Removed unnecessary `getConfiguredPriceIds()` calls
   - Direct product ID matching instead of fetching price IDs first

4. **`docs/stripe_integration.md`**
   - Clarified that `STRIPE_SUBSCRIPTION_ID_*` should use product IDs, not price IDs
   - Added comments explaining why product IDs are used
   - Updated Azure Key Vault examples

## How It Works Now

### 1. Purchase Flow
```
User completes checkout
  ↓
Stripe returns session with line items
  ↓
Line item contains: { price: { id: "price_xxx", product: "prod_xxx" } }
  ↓
System extracts product ID: "prod_xxx"
  ↓
Compares with env: STRIPE_SUBSCRIPTION_ID_BASIC=prod_xxx
  ↓
Match! ✅ → Update user to "basic" access level
```

### 2. Product ID Extraction
```typescript
// Extract product ID from line item
// Can be either a string ID or a full product object
const productId = typeof item.price?.product === 'string' 
  ? item.price.product 
  : item.price?.product?.id
```

### 3. Matching Logic
```typescript
if (productId === premiumProductId) {
  return 'premium'
} else if (productId === basicProductId) {
  return 'basic'
} else {
  return 'free'
}
```

## Configuration

### Environment Variables (`.env.local`)
```bash
# Use PRODUCT IDs (prod_xxx), NOT price IDs (price_xxx)
STRIPE_SUBSCRIPTION_ID_BASIC=prod_T39h3WRmuzvZiC
STRIPE_SUBSCRIPTION_ID_PREMIUM=prod_T39iXOeIA3qndO
```

### Finding Your Product IDs

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click on a product
3. Copy the Product ID (starts with `prod_`)
4. Do NOT use the Price ID (starts with `price_`)

## Testing

To verify the fix works:

1. Start your dev server with webhook tunnel: `pnpm dev:tunnel`
2. Navigate to `/dashboard`
3. Click "Upgrade" on a plan
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Check terminal logs for:
   ```
   🔍 Comparing product IDs:
   Expected Basic Product ID: prod_T39h3WRmuzvZiC
   Found product ID in line item: prod_T39h3WRmuzvZiC
   ✅ Matched basic subscription by product ID!
   ```
6. Refresh the page - you should see your new access level

## Troubleshooting

### Issue: User still shows "free" after purchase

**Check 1: Verify Product IDs in Environment**
```bash
# Should show prod_xxx, NOT price_xxx
grep STRIPE_SUBSCRIPTION_ID .env.local
```

**Check 2: Check Terminal Logs**
Look for the comparison output:
```
🔍 Comparing product IDs:
Expected Basic Product ID: prod_xxx
Found product ID in line item: prod_yyy
⚠️ Product ID does not match basic or premium
```

If they don't match, update your `.env.local` with the correct product IDs.

**Check 3: Restart Server**
After changing environment variables, restart your dev server:
```bash
# Stop current server (Ctrl+C)
pnpm dev:tunnel
```

### Issue: Prices not displaying

**This is separate from access level matching!**

The system fetches current prices from Stripe for display using the same product IDs. If prices aren't showing:

1. Check that products have active prices in Stripe Dashboard
2. Check browser console for errors
3. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set

## Migration Notes

### If You Were Using Price IDs Before

**Old Configuration (❌ Don't use):**
```bash
STRIPE_SUBSCRIPTION_ID_BASIC=price_1S73OLFFXCDWq7wscEIc3Xz0
STRIPE_SUBSCRIPTION_ID_PREMIUM=price_1S73P7FFXCDWq7wsMsWLYjnB
```

**New Configuration (✅ Use this):**
```bash
STRIPE_SUBSCRIPTION_ID_BASIC=prod_T39h3WRmuzvZiC
STRIPE_SUBSCRIPTION_ID_PREMIUM=prod_T39iXOeIA3qndO
```

### No Database Changes Required

This fix only changes the matching logic. No database migrations needed!

## Benefits Summary

| Aspect | Before (Price IDs) | After (Product IDs) |
|--------|-------------------|---------------------|
| Price updates | Break the system ❌ | Work seamlessly ✅ |
| Configuration | Changes with prices ❌ | Stable forever ✅ |
| Maintenance | Update code when prices change ❌ | No code changes needed ✅ |
| Testing | Harder to debug ❌ | Clear logging ✅ |

## Related Files

- Core Logic: `src/lib/stripe/stripe-utils.ts`
- User Service: `src/lib/user/user-service.ts`
- Webhook Handler: `src/lib/stripe/stripe-service.ts`
- Documentation: `docs/stripe_integration.md`

## Questions?

If you encounter issues:
1. Check the detailed logging in terminal
2. Verify product IDs match between Stripe and `.env.local`
3. Ensure you restarted the server after env changes
4. Check that the Stripe webhook is receiving events


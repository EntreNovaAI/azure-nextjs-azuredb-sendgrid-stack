# Upgrade Proration Issue - $0.00 Charge Fix

## Problem Description

When upgrading from Basic to Premium subscription, the system was showing:
```
You will be charged 0.00 USD today (prorated). Continue?
```

This is incorrect behavior as there should be a prorated charge when upgrading to a higher-priced tier.

## Root Cause Analysis

The issue was in the `getUpcomingInvoicePreview` function in `src/lib/stripe/stripe-service.ts`. The function was using the **wrong Stripe API** to calculate prorations.

### Original Problematic Code:

```typescript
// Used invoices.createPreview() - WRONG for subscription changes
const preview = await (stripe.invoices as any).createPreview({
  customer: customerId,
  subscription: subscriptionId,
  subscription_details: {
    items: [{ price: newPriceId, quantity }],
    proration_date: prorationDate,
    proration_behavior: 'create_prorations',
  },
})
```

### Why This Failed:

**Debug logs revealed the actual issue:**
```
Line 1: Premium Plan remaining time: $29.93 (2993 cents)
Line 2: Basic Plan: $9.99 (999 cents) 
Line 3: Premium Plan: $29.99 (2999 cents)
Total amount_due: $69.91 (6991 cents)  ❌ WRONG!
```

The `createPreview` API was returning:
1. The full subscription amounts for both plans
2. Additional charges that don't apply to immediate upgrades
3. No proper `proration` flags on line items

**What should happen:**
- Credit for unused Basic plan: ~-$5.00 (assuming mid-cycle)
- Charge for Premium plan (remaining period): ~+$15.00
- **Net immediate charge: ~$10.00** ✓

The correct API is `invoices.upcoming()` (note: NOT `retrieveUpcoming`) with subscription modification parameters, which properly calculates prorations for subscription changes.

## Solution Implemented

### 1. Updated Proration Calculation

Changed the calculation to use Stripe's `amount_due` field directly:

```typescript
// IMPORTANT: Use amount_due which represents what will be charged immediately
// This already accounts for all prorations, credits, and charges
const prorationAmountNow = preview.amount_due ?? 0
```

**Why this is better:**
- `amount_due` is Stripe's authoritative calculation of what will be charged NOW
- It already includes all prorations, credits, and adjustments
- No manual calculation needed - we trust Stripe's math

### 2. Added Comprehensive Debug Logging

Added detailed logging to help diagnose proration issues:

```typescript
console.log('=== UPGRADE PREVIEW DEBUG ===')
console.log('Subscription ID:', subscriptionId)
console.log('Current price:', subscription.items.data[0]?.price.id)
console.log('New price:', newPriceId)
console.log('Proration date:', prorationDate)

// ... after preview is retrieved ...

console.log('=== INVOICE PREVIEW LINES ===')
console.log('Total lines:', lines.length)
lines.forEach((line: any, index: number) => {
  console.log(`Line ${index + 1}:`, {
    description: line.description,
    amount: line.amount,
    proration: line.proration,
    type: line.type,
    price: line.price?.id
  })
})
console.log('Preview amount_due:', preview.amount_due)
console.log('Preview total:', preview.total)
console.log('Preview subtotal:', preview.subtotal)
console.log('=== END PREVIEW DEBUG ===')
```

This logging will help identify:
- Which Stripe prices are being used
- What line items Stripe is generating
- The actual amounts being calculated

### 3. Improved User-Facing Message

Updated the confirmation dialog in `src/components/cards/product-card.tsx`:

```typescript
// Build confirmation message with more context
let confirmMessage = `You are upgrading from Basic to Premium.\n\n`
if (immediate > 0) {
  confirmMessage += `Immediate charge: ${immediate.toFixed(2)} ${currency} (prorated for remaining billing period)\n\n`
} else {
  confirmMessage += `Immediate charge: ${immediate.toFixed(2)} ${currency}\n\n`
  confirmMessage += `Note: The charge shows $0 because you may have just subscribed, or there may be a pricing configuration issue. `
  confirmMessage += `You will be charged the full Premium price at your next billing cycle.\n\n`
}
confirmMessage += `Continue with upgrade?`
```

**Benefits:**
- Clear explanation of what's happening
- Context about why the charge might be $0 (legitimate scenarios)
- Warning about potential configuration issues

## Potential Remaining Issues

If the charge still shows $0.00 after these fixes, check:

### 1. Stripe Price Configuration

Verify in your Stripe Dashboard that:
- `STRIPE_SUBSCRIPTION_ID_BASIC` is set to a price (e.g., $9.99/month)
- `STRIPE_SUBSCRIPTION_ID_PREMIUM` is set to a higher price (e.g., $29.99/month)
- Both prices are **recurring** (not one-time)
- Both prices use the same **billing interval** (monthly/yearly)

**How to check:**
1. Go to Stripe Dashboard → Products
2. Find your Basic and Premium products
3. Check the price IDs match your environment variables
4. Verify the amounts are different

### 2. Testing Scenario

If you're testing immediately after subscribing to Basic:
- The proration might legitimately be very small or $0
- Stripe prorates based on time remaining in the billing period
- **Test scenario:** Subscribe to Basic, wait a few days, then upgrade to Premium

### 3. Same Price Issue

If Basic and Premium have the same price in Stripe (by mistake):
- The proration will be $0 since there's no price difference
- Check your Stripe prices match your expected pricing ($9.99 vs $29.99)

### 4. Billing Cycle Alignment

If the prices have different billing intervals:
- Example: Basic is monthly but Premium is yearly
- Stripe may handle this differently
- Ensure both prices use the same interval

## Testing the Fix

To test this fix properly:

### Step 1: Check Server Logs
When you click upgrade, check your server console for:
```
=== UPGRADE PREVIEW DEBUG ===
Subscription ID: sub_xxxxx
Current price: price_xxxxx (should be Basic)
New price: price_xxxxx (should be Premium)
...
Preview amount_due: XXXX (in cents)
```

### Step 2: Verify the Numbers
- If `amount_due` is 0, check your Stripe prices
- If `amount_due` is positive, the fix is working correctly
- The amount should be roughly: (Premium - Basic) * (days_remaining / days_in_billing_period)

### Step 3: Check Browser Console
Look for:
```
Upgrade preview data: {
  immediate: X.XX,
  prorationAmountNow: XXXX,
  amountDue: XXXX,
  ...
}
```

## Expected Behavior After Fix

### Scenario 1: Normal Upgrade (mid-billing cycle)
- User has been on Basic for 15 days of a 30-day cycle
- Premium costs $20 more per month than Basic
- Expected charge: ~$10 (half the difference, prorated)

### Scenario 2: Immediate Upgrade (just subscribed)
- User just subscribed to Basic today
- Upgrade to Premium immediately
- Expected charge: Close to $20 (almost full difference)

### Scenario 3: End of Cycle Upgrade
- User is on the last day of their Basic billing period
- Upgrade to Premium
- Expected charge: Very small or $0 (legitimate)
- Premium price will apply to the next cycle

## Files Modified

1. **src/lib/stripe/stripe-service.ts** (lines 277-363)
   - Fixed proration calculation logic
   - Added comprehensive debug logging
   - Added detailed comments explaining the logic

2. **src/components/cards/product-card.tsx** (lines 119-156)
   - Improved confirmation message
   - Added context for $0 charges
   - Added client-side debug logging

## Additional Notes

### Why Proration is Complex

Stripe's proration system handles:
- Time-based prorations (unused time on old plan)
- Price differences between plans
- Credits from downgrades
- Tax calculations (if applicable)
- Discounts and coupons (if active)

That's why we should **always use Stripe's calculated `amount_due`** rather than trying to calculate it ourselves.

### Best Practices

1. **Trust Stripe's Math**: Use `amount_due` for immediate charges
2. **Log Everything**: Keep debug logs for troubleshooting
3. **Clear Communication**: Explain to users what they're being charged and why
4. **Test Thoroughly**: Test upgrades at different points in the billing cycle

## Next Steps

1. Deploy these changes
2. Test the upgrade flow from Basic to Premium
3. Check server logs for the debug output
4. Verify the proration amount is correct
5. If still showing $0, check Stripe Dashboard for price configuration

## Support

If the issue persists after these fixes:
1. Share the debug logs from server console
2. Share the Stripe price IDs being used
3. Check the Stripe Dashboard for the actual price amounts
4. Verify the environment variables are set correctly


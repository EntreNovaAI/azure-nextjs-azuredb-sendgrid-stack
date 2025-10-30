# Credit Card Number Protection in Customer Names

## Overview

This document explains the security measures implemented to prevent credit card numbers from being stored as customer names in the database.

## Problem

In some cases, Stripe may incorrectly set a customer's name to their credit card number. This can happen when:
- Payment forms auto-fill incorrectly
- Users accidentally paste their card number in the name field
- Payment processors send malformed data

Without proper validation, these credit card numbers could be stored in our database and displayed in the user's profile, creating a security and privacy risk.

## Solution

We implemented a multi-layered validation system that detects and blocks credit card numbers from being saved as customer names.

### 1. Detection Function: `looksLikeCreditCardNumber()`

**Location:** `src/lib/stripe/stripe-utils.ts`

This function detects strings that look like credit card numbers by:
- Removing common separators (spaces, hyphens, dots)
- Checking if 90%+ of characters are digits
- Verifying the length is within the credit card range (13-19 digits)

```typescript
looksLikeCreditCardNumber('4532015112830366') // true
looksLikeCreditCardNumber('4532 0151 1283 0366') // true
looksLikeCreditCardNumber('John Doe') // false
```

### 2. Sanitization Function: `sanitizeCustomerName()`

**Location:** `src/lib/stripe/stripe-utils.ts`

This function validates and sanitizes customer names by:
- Trimming whitespace
- Checking for credit card numbers
- Enforcing minimum name length (2 characters)
- Returning `null` for invalid names

```typescript
sanitizeCustomerName('John Doe') // 'John Doe'
sanitizeCustomerName('4532015112830366') // null
sanitizeCustomerName('  Jane Smith  ') // 'Jane Smith'
```

### 3. Protection Points

The sanitization is applied at multiple critical points:

#### A. Stripe Webhook: `customer.created`
**Location:** `src/lib/stripe/stripe-service.ts` (lines 769-812)

When a new Stripe customer is created, we sanitize the name before creating the user record:
- Blocks credit card numbers from initial user creation
- Logs warnings when invalid names are detected
- Falls back to `null` name if validation fails

#### B. Stripe Webhook: `customer.updated`
**Location:** `src/lib/stripe/stripe-service.ts` (lines 804-855)

When Stripe sends customer updates, we sanitize before updating the database:
- Prevents credit card numbers from overwriting existing valid names
- Only updates name if it passes validation
- Logs security warnings for blocked updates

#### C. Session Status API: `getSessionStatus()`
**Location:** `src/lib/stripe/stripe-service.ts` (lines 394-460)

When retrieving session data for checkout confirmation:
- Sanitizes customer name before returning to client
- Prevents credit card numbers from being displayed in UI
- Logs when invalid names are filtered

## Detection Criteria

A string is considered a potential credit card number if:
1. **Length:** 13-19 characters (after removing separators)
2. **Digit Ratio:** 90% or more characters are digits
3. **Format:** May contain spaces, hyphens, or dots as separators

### Examples Blocked:
- `4532015112830366` (16 digits)
- `4532 0151 1283 0366` (with spaces)
- `4532-0151-1283-0366` (with hyphens)
- `378282246310005` (15-digit Amex)

### Examples Allowed:
- `John Doe` (normal name)
- `Mary O'Brien-Smith` (with punctuation)
- `John Doe 2nd` (with numbers)
- `12345` (too short to be a card)

## Logging and Monitoring

When a credit card number is detected and blocked, the system logs a warning with:
- Customer ID or Session ID for tracking
- Reason for rejection
- Event type (creation, update, session retrieval)

Example log:
```javascript
console.warn('Blocked invalid customer name update:', {
  customerId: 'cus_xxx',
  reason: 'Name failed validation (likely credit card number or invalid format)'
})
```

## Testing

Comprehensive unit tests are located in:
- **File:** `tests/unit/lib/stripe/stripe-utils.test.ts`

Tests cover:
- Various credit card formats (16, 15, 13 digits)
- Credit cards with separators (spaces, hyphens)
- Valid names (with special characters, numbers, etc.)
- Edge cases (null, undefined, empty strings)

Run tests with:
```bash
pnpm test tests/unit/lib/stripe/stripe-utils.test.ts
```

## Security Benefits

1. **Privacy Protection:** Prevents sensitive payment data from being stored in user profiles
2. **Data Minimization:** Reduces PCI DSS compliance scope by not storing card data
3. **User Trust:** Prevents embarrassing display of card numbers in profile pages
4. **Audit Trail:** All blocked attempts are logged for security monitoring

## Future Enhancements

Potential improvements to consider:
- Add Luhn algorithm validation for more accurate detection
- Implement database migration to clean up existing invalid names
- Add alert/notification system for security team when blocks occur
- Expand validation to other PII patterns (SSN, etc.)

## Related Files

- `src/lib/stripe/stripe-utils.ts` - Validation functions
- `src/lib/stripe/stripe-service.ts` - Webhook handlers
- `tests/unit/lib/stripe/stripe-utils.test.ts` - Unit tests
- `app/profile/profile-client.tsx` - Profile display (consumer of sanitized data)


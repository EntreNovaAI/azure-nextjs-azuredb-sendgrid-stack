# Stripe Integration Guide

This guide walks you through setting up Stripe payments for the Azure NextJS Heavy Stack application. The app supports subscription-based payments with two tiers: Basic ($9.99/month) and Premium ($29.99/month).

## Quick Setup Overview

1. Create a Stripe account and get your API keys
2. Create two subscription products in Stripe Dashboard
3. Add the required environment variables to your `.env.local` file
4. Set up webhook endpoints for payment processing

## 1. Create Stripe Account and Get API Keys

### Step 1: Sign up for Stripe
1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" and create your account
3. Complete the verification process if needed

### Step 2: Get Your API Keys
1. In your Stripe Dashboard, go to **Developers** → **API keys**
2. You'll need these keys (make sure you're in **a sandbox** for development):
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

## 2. Create Subscription Products

The application expects two subscription tiers. Create these in your Stripe Dashboard:

### Step 1: Create Basic Subscription
1. Go to **Product catalog** in your Stripe Dashboard
2. Click **+ Create product**
3. Fill in the details:
   - **Name**: `Basic Plan`
   - **Description**: `Advanced features for growing businesses`
   - **Pricing**: `$9.99 USD` per `month`
   - **Billing period**: `Monthly`
4. Click **Add product**
5. **Important**: Copy the **Price ID** (starts with `price_...`) - you'll need this for your environment variables. You can just right click the product and you willl have the option to copy it.

### Step 2: Create Premium Subscription
1. Repeat for 2nd product. Of course, adjusting price as desired.

## 3. Set Up Webhook Endpoint

Webhooks are essential for processing completed payments and updating user subscriptions.

### Step 1: Create Webhook Endpoint
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. For the endpoint URL, use:
   - **Local development**: `https://your-devtunnel-url.devtunnels.ms/api/stripe/webhooks/stripe`
   - **Production**: `https://your-domain.com/api/stripe/webhooks/stripe`
4. Select these events to listen for:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. **Important**: Copy the **Signing secret** (starts with `whsec_...`) - you'll need this for your environment variables

### Step 2: Get Your Dev Tunnel URL (for local development)
If you haven't set up a dev tunnel yet, follow these steps:
1. Install the dev tunnel CLI: `npm install -g @microsoft/dev-tunnels-cli`
2. Login: `devtunnel user login`
3. Create a tunnel: `devtunnel create --allow-anonymous`
4. Start the tunnel: `devtunnel port create -p 3000`
5. Copy the HTTPS URL provided

## 4. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here

# Stripe Subscription Product IDs (NOT price IDs)
# Use product IDs (prod_xxx) instead of price IDs (price_xxx)
# Product IDs are stable, while price IDs can change when you update pricing
# The system will automatically fetch the current active price for each product
STRIPE_SUBSCRIPTION_ID_BASIC=prod_your_basic_product_id_here
STRIPE_SUBSCRIPTION_ID_PREMIUM=prod_your_premium_product_id_here
```

## 5. Test Your Integration

### Step 1: Start Your Application
```bash
pnpm dev
```

### Step 2: Test the Payment Flow
1. Navigate to `http://localhost:3000/dashboard`
2. Click on either "Basic Plan" or "Premium Plan"
3. You'll be redirected to the checkout page
4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., `12/28`)
   - Use any 3-digit CVC (e.g., `123`)
   - Use any ZIP code (e.g., `12345`)

### Step 3: Verify Webhook Processing
1. After a successful test payment, check your application logs
2. You should see webhook events being processed
3. Check your database to confirm user subscription status was updated

## 6. How the Integration Works

### Payment Flow
1. User selects a subscription plan on `/dashboard` page
2. User is redirected to `/checkout` page with Stripe's embedded checkout
3. After payment, Stripe redirects to `/checkout/return` page
4. Stripe sends a webhook to `/api/stripe/webhooks/stripe` to confirm payment
5. The webhook handler updates the user's subscription in the database

### Key Components
- **`/app/_components/payment/stripe-checkout.tsx`**: Embedded Stripe checkout component
- **`/app/api/stripe/create-checkout/route.ts`**: Creates Stripe checkout sessions
- **`/app/api/stripe/webhooks/stripe/route.ts`**: Handles payment completion webhooks
- **`/app/_data/products.ts`**: Defines the subscription plans and pricing

### Database Updates
When a payment is completed, the webhook handler:
1. Identifies the user by email from the Stripe session
2. Determines the subscription tier (basic/premium) from the price ID
3. Updates the user record with:
   - Stripe customer ID
   - Subscription status
   - Access level

## 7. Production Deployment

### Environment Variables for Production
Make sure to update your production environment variables:
1. Replace test keys with live keys (starts with `pk_live_...` and `sk_live_...`)
2. Update webhook endpoint URL to your production domain
3. Create new webhook endpoint in Stripe Dashboard with production URL

### Azure Key Vault Integration
This application supports Azure Key Vault for secure secret management. Add your Stripe keys to Key Vault:

```bash
# Set Stripe secrets in Azure Key Vault
az keyvault secret set --vault-name your-vault-name --name STRIPE_SECRET_KEY --value "sk_live_..."
az keyvault secret set --vault-name your-vault-name --name STRIPE_WEBHOOK_SECRET --value "whsec_..."
az keyvault secret set --vault-name your-vault-name --name NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_..."
az keyvault secret set --vault-name your-vault-name --name STRIPE_SUBSCRIPTION_ID_BASIC --value "prod_..."
az keyvault secret set --vault-name your-vault-name --name STRIPE_SUBSCRIPTION_ID_PREMIUM --value "prod_..."
```

## Troubleshooting

### Getting Help

- Check the [Stripe Documentation](https://stripe.com/docs)
- Review Stripe Dashboard logs for payment and webhook events
- Enable debug logging in the application for detailed error messages
- Test with Stripe's test card numbers before going live

## Security Notes

- Never commit your secret keys to version control
- Use environment variables for all sensitive data
- Always validate webhook signatures to prevent fraud
- Implement proper error handling for failed payments
- Use HTTPS for all webhook endpoints
- Keep your Stripe integration up to date with the latest API versions

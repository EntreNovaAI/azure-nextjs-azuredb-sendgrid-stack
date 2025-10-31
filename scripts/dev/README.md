# Development Scripts

This directory contains scripts for setting up and running the application in **development mode**.

## Prerequisites

- **Stripe test account**: https://dashboard.stripe.com/register
- **Node.js 18+**: https://nodejs.org/
- **pnpm** (or npm/yarn): `npm install -g pnpm`
- **Git Bash** (Windows): Comes with Git for Windows
- **Azure Dev Tunnels** or **ngrok** (for webhook testing)

### macOS Users

If you're on macOS (which uses zsh by default), run scripts with `bash`:

```bash
bash scripts/dev/01_stripe_setup.sh
```

## Scripts

### 1. 01_stripe_setup.sh - Stripe Test Mode Setup

Sets up Stripe test mode with subscription products.

**Purpose:**
- Creates two test subscription products (Basic and Premium)
- Updates `.env.local` with test API keys
- Provides webhook setup instructions

**Usage:**

```bash
# Interactive mode (recommended)
bash scripts/dev/01_stripe_setup.sh

# Non-interactive mode
bash scripts/dev/01_stripe_setup.sh --yes
```

**What it does:**
1. Validates Stripe test API keys
2. Creates monthly subscription products
3. Updates `.env.local` with credentials
4. Shows next steps for webhook setup

**Required information:**
- Stripe test secret key (`sk_test_...`)
- Stripe test publishable key (`pk_test_...`)
- Product pricing (defaults: $9.99 and $29.99)

**After running:**
1. Set up webhook in Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
   - URL: `http://localhost:3000/api/stripe/webhooks` (or tunnel URL)
   - Events: `checkout.session.completed`, `customer.subscription.*`
2. Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
3. Test with card: `4242 4242 4242 4242`

---

### 2. dev_with_tunnel.sh - Development Server with Public Tunnel

Starts Next.js dev server with a public tunnel for webhook testing.

**Purpose:**
- Creates a public URL for local development
- Enables testing Stripe webhooks locally
- Auto-configures Next.js for tunnel access

**Usage:**

```bash
bash scripts/dev/dev_with_tunnel.sh
```

**Tunnel options:**
1. **Azure Dev Tunnels** (recommended for Azure projects)
   - Install: https://aka.ms/devtunnels/download
   - Free tier available
   
2. **ngrok** (popular alternative)
   - Install: https://ngrok.com/download
   - Free tier available

**What it does:**
1. Starts tunnel on port 3000
2. Gets public URL
3. Updates `next.config.js` to allow tunnel origin
4. Sets `NEXTAUTH_URL` to tunnel URL
5. Starts Next.js dev server

**To stop:**
- Press `Ctrl+C` (cleans up automatically)

**Notes:**
- Tunnel URL changes on each restart (unless using paid tunnel service)
- Update webhook URL in Stripe Dashboard with new tunnel URL
- Original `next.config.js` is restored on exit

---

## Quick Start

### First-Time Setup

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Set up Stripe test mode
bash scripts/dev/01_stripe_setup.sh

# 3. Start dev server with tunnel (for webhook testing)
bash scripts/dev/dev_with_tunnel.sh
```

### Daily Development

```bash
# Start dev server with tunnel
bash scripts/dev/dev_with_tunnel.sh

# Or standard dev server (no webhooks)
pnpm run dev
```

---

## Environment Variables

After running the setup scripts, your `.env.local` should contain:

```env
# Database (local development)
MSSQL_SERVER=localhost
MSSQL_DATABASE=mydb
MSSQL_USER=sa
MSSQL_PASSWORD=YourPassword123!
MSSQL_ENCRYPT=false
MSSQL_POOL_MIN=0
MSSQL_POOL_MAX=10

# NextAuth
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000

# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUBSCRIPTION_ID_BASIC=prod_...
STRIPE_SUBSCRIPTION_ID_PREMIUM=prod_...
```

---

## Testing

### Test Stripe Payments

**Test card numbers:**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0027 6000 3184`

**Details:**
- Any future expiry date
- Any 3-digit CVC
- Any billing zip code

### Test Webhooks

1. Start tunnel: `bash scripts/dev/dev_with_tunnel.sh`
2. Copy tunnel URL
3. Update webhook in Stripe Dashboard
4. Trigger test events in Stripe Dashboard or make test purchases

---

## Troubleshooting

### "curl: command not found"
- **Windows**: Included with Windows 10+
- **macOS**: Pre-installed
- **Linux**: `sudo apt install curl`

### "Stripe API key invalid"
- Verify you're using **test** keys (start with `sk_test_` and `pk_test_`)
- Check for extra spaces or quotes
- Get keys from: https://dashboard.stripe.com/test/apikeys

### "Tunnel not starting"
- **Azure Dev Tunnels**: Install from https://aka.ms/devtunnels/download
- **ngrok**: Install from https://ngrok.com/download
- Check if port 3000 is already in use: `lsof -i :3000` (macOS/Linux)

### "Database connection failed"
- Ensure SQL Server is running locally
- Verify connection string in `.env.local`
- Check firewall settings

### Webhook events not received
- Verify tunnel is running
- Check webhook URL in Stripe Dashboard matches tunnel URL
- Verify webhook secret is correct in `.env.local`
- Check webhook logs in Stripe Dashboard

---

## Best Practices

1. **Never commit `.env.local`** to version control
2. **Use test mode** for development (never use live keys)
3. **Test webhooks** with tunnel before deploying
4. **Keep dependencies updated**: `pnpm update`
5. **Run linter**: `pnpm lint`
6. **Run tests**: `pnpm test`

---

## Related Documentation

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Next.js Development](https://nextjs.org/docs)
- [Azure Dev Tunnels](https://learn.microsoft.com/azure/developer/dev-tunnels/)

---

## Support

For issues or questions:
1. Check the [main README](../../README.md)
2. Review error messages carefully
3. Verify all prerequisites are installed
4. Check Stripe Dashboard for webhook logs

---

**Next Steps:** Ready for production? See [../deploy/README.md](../deploy/README.md)


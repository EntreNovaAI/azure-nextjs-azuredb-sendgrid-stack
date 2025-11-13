# Local Development Setup

> **Get up and running in minutes** 🚀

This guide walks you through setting up your local development environment from a fresh clone.

---

## 🎬 Quick Start

### Run the Setup Command

In Cursor, use the `/init` command. This will guide you through the entire setup process automatically.

**The AI will check if you have your database ready before running migrations.**

---

### Database Setup (Required Before Migrations)

You'll need SQL Server set up locally. The AI should guide you, but here's what you need:

**1. Install SQL Server Developer Edition**

- Download from [Microsoft SQL Server Downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- Choose "Developer" edition (free for development)

**2. Install SQL Server Management Studio (SSMS)**

- Download from [Microsoft SSMS Install Guide](https://learn.microsoft.com/en-us/ssms/install/install)
- This is your database management tool

**3. Create Database and User in SSMS**

Once installed, open SSMS and:

1. **Create a new database** for your project
2. **Create a SQL Server login:**
   - Expand **Security** on the server
   - Right-click **Logins** → **New Login**
   - Choose SQL Server authentication
   - Set username and password (save these!)
   - Uncheck **Enforce password policy** for local development
3. **Add user to your database:**
   - Expand your database → **Security** → **Users**
   - Right-click **Users** → **New User**
   - Map to the login you created
   - Grant **db_owner** permissions

**4. Add database credentials to `.env.local`**

The `/init` command creates `.env.local` for you. Add your database info:

```env
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_USER=your_username
MSSQL_PASSWORD=your_password
MSSQL_DATABASE=your_database_name
MSSQL_ENCRYPT=false
```

**Once this is done, tell the AI to run the database migration script.**

---

### What the `/init` Command Does

The AI will guide you through running these scripts in order:

1. **Initialization Script** (`scripts/dev/00_init_setup.sh`)
   - Checks for all required and optional tools
   - Offers to install missing prerequisites interactively
   - Creates `.env.local` automatically from `.env.example`
   - All actions logged to `logs/init-setup.log`
   
   *Manual run:* `bash scripts/dev/00_init_setup.sh`

2. **Install Dependencies** 
   - Runs `pnpm install` to install all project packages

3. **Environment Setup**
   - Helps generate `NEXTAUTH_SECRET`
   - Guides you through required variables

4. **Database Setup** (`scripts/dev/02_db_setup.sh`)
   - Runs migrations to create tables
   - Creates: User, Account, Session, VerificationToken, PasswordResetToken - note only User and PasswordResetToken are used in the template, the others are there if you may need them for something. Feel free to rename them and alter the structure of them as per your project needs.


   *Manual run:* `bash scripts/dev/02_db_setup.sh`

5. **Optional: Stripe Setup** (`scripts/dev/01_stripe_setup.sh`)
   - Authenticates with Stripe via browser
   - Creates test products (Basic & Premium)
   - Updates `.env.local` with API keys
   
   *Manual run:* `bash scripts/dev/01_stripe_setup.sh`

6. **Start Development Server**
   - Standard: `pnpm dev`
   - With webhook tunnel: `bash scripts/dev/dev_with_tunnel.sh`

**Note:** If the AI goes off track, you can run any of these scripts manually using the commands shown above.

---

## 🔧 After Setup

Once the initialization is complete, follow these steps:

---

### 1. Start Dev Server with Tunnel

Run the dev server with a public tunnel (needed for OAuth and webhooks):

```bash
bash scripts/dev/dev_with_tunnel.sh
```

This will:
- Ask you to choose between Azure Dev Tunnels or ngrok
- Start a tunnel on port 3000
- Give you a public URL (e.g., `https://xxx.devtunnels.ms` or `https://xxx.ngrok.io`)

**Save this tunnel URL!** You'll need it for the next steps.

---

### 2. Set Up Google OAuth

To enable Google login, create a Google Cloud project:

**A. Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google People API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google People API"
   - Click "Enable"

**B. Configure OAuth Consent Screen**

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for testing)
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact email
4. Save and continue

**C. Create OAuth Credentials**

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add **Authorized JavaScript origins:**
   ```
   [your-tunnel-url]
   ```
   Example: `https://abc123.devtunnels.ms`

5. Add **Authorized redirect URIs:**
   ```
   [your-tunnel-url]/api/auth/callback/google
   ```
   Example: `https://abc123.devtunnels.ms/api/auth/callback/google`

6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

**D. Update `.env.local`**

Add your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

### 3. Configure Stripe Dashboard Settings

Before setting up webhooks, configure your Stripe branding and portal settings:

**A. Configure Branding**

1. Go to [Stripe Dashboard → Settings → Business → Branding](https://dashboard.stripe.com/settings/branding)
2. Set up your branding for:
   - **Checkout & Payment Links** - Logo, colors, and styling for payment checkout
   - **Customer portal** - How customers see their billing information

This ensures your payment pages match your app identity. There are a few other neat things here you may want to explore.

---

### 4. Set Up Stripe Webhooks

Configure Stripe to send webhook events to your app:

**A. Create Webhook Endpoint**

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "+ Add endpoint"
3. Enter your webhook URL:
   ```
   [your-tunnel-url]/api/stripe/webhooks
   ```
   Example: `https://abc123.devtunnels.ms/api/stripe/webhooks`

**B. Select Events**

Add these events (or whichever your project requires):

- `checkout.session.completed`
- `customer.created`
- `customer.deleted`
- `customer.updated`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**C. Copy Webhook Secret**

1. After creating the endpoint, copy the **Signing secret** (starts with `whsec_`)
2. Add to `.env.local`:

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

---

### 5. Configure MailerSend

For password reset emails (if using email/password login):

**A. Sign Up and Get API Key**

1. Sign up at [MailerSend](https://www.mailersend.com/)
2. Go to **Settings** → **API Tokens**
3. Create a new token (copy it, starts with `mlsn.`)

**B. Verify Domain**

1. Add your domain in MailerSend dashboard
2. Verify DNS records (follow their instructions)
3. Once verified, you can send from `info@yourdomain.com`

**C. Update `.env.local`**

Add these three variables:

```env
MAILERSEND_API_KEY=mlsn.your_token_here
MAILERSEND_FROM_EMAIL=info@yourdomain.com
MAILERSEND_FROM_NAME=Your App Name
```

**Variable Explanation:**

- `MAILERSEND_API_KEY` - Your API token from MailerSend (starts with `mlsn.`)
- `MAILERSEND_FROM_EMAIL` - The "from" email address, typically `info@yourdomain.com`
- `MAILERSEND_FROM_NAME` - Display name for emails (e.g., "John", "Support Team", "MyApp")

---

### 6. Restart Dev Server

After adding all environment variables, restart your dev server:

Press `Ctrl+C` to stop, then run again:

```bash
bash scripts/dev/dev_with_tunnel.sh
```

Visit your tunnel URL to test! 🚀

---

## 🎨 Customize Your App

### Update Theme Colors & Fonts

Use the `/style` command in Cursor to quickly update:

- Brand colors (light/dark mode)
- Typography (only supports Google Fonts)

### Review Development Principles

See [DEVELOPMENT_PRINCIPLES.md](DEVELOPMENT_PRINCIPLES.MD) for:

- Project structure
- Component guidelines
- Content separation patterns
- Best practices

---


---

## 📚 Next Steps

**Building Features:**

- Follow [DEVELOPMENT_PRINCIPLES.md](DEVELOPMENT_PRINCIPLES.MD)
- Marketing pages go in `app/(marketing)/`
- Product pages go in `app/(product)/`
- Logic goes in `src/`

**Testing:**

- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`

**Ready to Deploy?**

- See [DEPLOYMENT.md](DEPLOYMENT.md) when you're ready for production

---

**Need help?** The `/init` command in Cursor will walk you through each step with detailed guidance!

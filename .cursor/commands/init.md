# init

## Personality

You are an expert DevOps engineer. You guide users through setting up this Azure Next.js Stack project from a fresh git clone to a fully functional development environment.

## Purpose

This command sets up the project for local development after cloning from git. It handles dependency installation, environment configuration, database setup, and initial migrations using pnpm.

## Setup Process

Follow these steps in order. Guide the user through each step clearly.

### Step 1: Run Automated Setup

**Execute the automated initialization script:**

```bash
bash scripts/dev/00_init_setup.sh
```

This script will:
- Detect your operating system and package manager
- Check for all required and optional tools
- Interactively offer to install missing prerequisites
- Guide you through the installation process

**What gets installed:**

Critical (required):
- Node.js 20+ LTS
- pnpm package manager

Deployment tools (optional, can skip):
- Azure CLI
- Bicep CLI
- Docker

Additional tools (optional, can skip):
- jq (JSON processor)
- Git (version control)
- Stripe CLI (webhook testing)

**Notes:**
- All prompts default to [Y/n] for easy confirmation
- You can skip optional tools and install them later
- The script is safe to run multiple times
- All actions are logged to `logs/init-setup.log`

**If the automated script fails:**

You can still install prerequisites manually. The required tools are:
- Node.js 20+: Download from https://nodejs.org/
- pnpm: Run `corepack enable && corepack prepare pnpm@latest --activate`

### Step 2: Install Dependencies

Run the installation command:

```bash
pnpm install
```

Wait for completion. Inform the user this may take a few minutes on first install.

### Step 3: Database Setup

**Ask the user which database option they prefer:**

**Option A: Azure SQL Database (Recommended for production-like setup)**
1. User needs an Azure SQL Database instance
2. Guide them to create one via Azure Portal or ask for existing credentials
3. They'll need: server name, database name, username, password

**Option B: Local SQL Server (For local development)**
1. User needs SQL Server installed locally
2. Can use SQL Server Express (free) or Developer Edition
3. Can use SSMS or Azure Data Studio to manage
4. Guide them to create a new database (e.g., `azure_nextjs_dev`)


Once they choose, continue

### Step 4: Environment Configuration

**Copy .env.example and name it `.env.local`:**

Guide the user to create `.env.local` in the project root with this content:

```env
# ============================================================
# Database Configuration (Azure SQL or MSSQL)
# ============================================================
MSSQL_SERVER=your-server-address
MSSQL_DATABASE=your-database-name
MSSQL_USER=your-username
MSSQL_PASSWORD=your-password
MSSQL_ENCRYPT=true
MSSQL_POOL_MIN=0
MSSQL_POOL_MAX=10

# ============================================================
# NextAuth Configuration
# ============================================================
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# ============================================================
# OAuth Providers (Optional - for full auth features)
# ============================================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ============================================================
# Stripe (Optional - for payment features)
# ============================================================
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# ============================================================
# Azure Services (Optional)
# ============================================================
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_WEBPUBSUB_CONNECTION_STRING=your-pubsub-connection-string
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

# ============================================================
# Email Service (Optional)
# ============================================================
MAILERSEND_API_KEY=your-mailersend-api-key
MAILERSEND_FROM_EMAIL=noreply@your-domain.com
MAILERSEND_FROM_NAME=Your App Name
```

**Help them generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Minimum Required for Basic Setup:**
- All MSSQL_* variables
- NEXTAUTH_SECRET
- NEXTAUTH_URL

**Optional:** Guide them on which optional services they want to set up based on their needs.

### Step 5: Run Database Migrations

Once environment variables are set, run the Kysely migration script:

```bash
pnpm dlx tsx kysely/migration-script.ts
```

This will:
- Create all necessary database tables
- Set up the authentication schema
- Initialize the database structure

**What to expect:**
- You should see success messages for each migration
- Tables created: User, Account, Session, VerificationToken, PasswordResetToken

**If errors occur:**
- Verify database credentials in `.env.local`
- Ensure the database exists
- Check that the user has proper permissions
- Verify network connectivity to the database

### Step 6: Start Development Server

Run the development server:

```bash
pnpm dev
```

The application should start on `http://localhost:3000`

**Verify the setup:**
1. Open browser to `http://localhost:3000`
2. You should see the landing page
3. Basic navigation should work

### Step 7: Optional - Google OAuth Setup

**If the user wants full authentication features:**

1. Guide them to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google People API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`
7. Restart the dev server

### Step 8: Optional - Dev Tunnels (For webhooks/OAuth testing)

**Only needed if they want to test:**
- Stripe webhooks
- Full OAuth flows
- External API callbacks

If needed, guide them through:
```bash
devtunnel create myapp -a
devtunnel port create -p 3000
devtunnel host
```

Then update `NEXTAUTH_URL` to the tunnel URL and add it to Google OAuth redirect URIs.

## Completion Checklist

Once setup is complete, verify:
- ✅ Dependencies installed (`node_modules` exists)
- ✅ `.env.local` file created with database credentials
- ✅ Database accessible and migrations run successfully
- ✅ Dev server starts without errors
- ✅ Landing page loads at `http://localhost:3000`
- ✅ (Optional) Authentication working if OAuth configured

## Common Issues & Solutions

**Automated setup script errors:**
- Run `bash scripts/deploy/00_validate_prerequisites.sh` to see what's missing
- Check `logs/init-setup.log` for detailed error messages
- Some installations may require sudo/admin privileges
- On Windows, use Git Bash or WSL for best compatibility

**Database connection fails:**
- Verify server address, port, username, password
- For Azure SQL: ensure firewall allows your IP
- For local SQL: ensure SQL Server service is running
- Check MSSQL_ENCRYPT setting (true for Azure, false for local typically)

**Migration errors:**
- Ensure database exists before running migrations
- Check user has CREATE TABLE permissions
- Try running migrations again (they're idempotent)

**Dev server won't start:**
- Check if port 3000 is already in use
- Verify all required env variables are set
- Check for syntax errors in `.env.local`

**Authentication not working:**
- NEXTAUTH_SECRET must be set
- For Google OAuth: credentials must be valid
- For webhooks: dev tunnels or public URL required

**Installation troubleshooting:**
- Node.js: If corepack fails, use `npm install -g pnpm` instead
- Docker: On macOS/Windows, install Docker Desktop manually
- Azure CLI: On Windows, download MSI from https://aka.ms/installazurecliwindows
- Permission errors: Some commands may need `sudo` on Linux/macOS

## What's Next?

After successful setup, the user can:
- Start building features
- Customize theme colors with `/style`
- Create marketing pages with `/ad-page`
- Deploy to Azure (see `docs/setup_guide.md`)

This command will be available in chat with /init

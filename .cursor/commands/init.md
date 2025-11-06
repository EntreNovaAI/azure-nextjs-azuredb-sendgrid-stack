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

### Step 3: Environment Configuration

**Copy .env.example and name it `.env.local`:**

```bash
cp .env.example .env.local
```

**Help them generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Run Database Migrations

Once environment variables are set, run the database setup script:

```bash
bash scripts/dev/02_db_setup.sh
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


### Step 6: Optional - Stripe Setup (Recommended)

**If you want to enable subscription/payment features:**

Run the Stripe setup script to configure test products and API keys:

```bash
bash scripts/dev/01_stripe_setup.sh
```

This will:
- Authenticate with Stripe via browser login
- Create test subscription products (Basic and Premium plans)
- Automatically configure your `.env.local` with API keys
- Provide instructions for webhook setup

**After Stripe setup, use the dev tunnel script for webhook testing:**

```bash
bash scripts/dev/dev_with_tunnel.sh -stripe
```

This will:
- Start a public tunnel (choose Azure Dev Tunnels or ngrok)
- Automatically configure Stripe webhooks
- Start your dev server with the public URL
- Enable real-time webhook event testing

**Note:** The `-stripe` flag automatically handles webhook configuration. Without it, webhooks won't be set up.


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

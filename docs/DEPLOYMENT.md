# Deployment Guide

This guide walks you through deploying your Next.js application to Azure using automated bash scripts.

## Overview

The deployment uses a series of bash scripts that automate Azure infrastructure provisioning and application deployment. The process is broken into sequential steps to handle dependencies and allow for manual verification at each stage.

## Prerequisites

Before starting deployment, run the prerequisites validation script:

```bash
bash scripts/deploy/00_validate_prerequisites/00_validate_prerequisites.sh
```

## Pre-Deployment: Clean Up Your Environment File

Before deploying to production, consider removing any API keys and secrets from your `.env.local` file that you won't need for **production**.

## Deployment Workflow

The deployment follows a **two-phase strategy** to solve the "chicken and egg" problem where Container Apps need a Docker image, but you need infrastructure to push the image.

### Phase 1: Foundation Infrastructure

**Script:** `01_deploy_infrastructure.sh`

**Prerequisites - Required Azure Permissions:**

Before starting, ensure you have the following roles on the resource group you intend to deploy to:

- **Contributor** - Create and manage Azure resources
- **Key Vault Contributor** - Manage Key Vault and secrets
- **User Access Administrator** - Assign RBAC roles to managed identities

**What it does:**

- Copies `.env.local` to `.env.production` and sets `NODE_ENV=production`
- Updates Azure-specific variables (database, Key Vault, Container Registry)
- Keeps all other variables from your `.env.local`
- Deploys core Azure infrastructure using Bicep templates:
  - Azure SQL Database
  - Azure Container Registry (ACR)
  - Azure Key Vault
  - Container Apps Environment
  - Managed Identity
- Generates `.env.production` with Azure resource details
- Does **NOT** deploy the Container App yet (no Docker image required)

**Why clean up `.env.local` first?** This ensures your production environment only contains relevant configuration and speeds up later steps where we upload secrets to Key Vault and bind them to the Container App.

**Run it:**

```bash
bash scripts/deploy/01_deploy_infrastructure/01_deploy_infrastructure.sh
```

**What happens:**

- Creates all infrastructure resources
- Updates `.env.production` with connection strings and resource names
- Saves deployment outputs for later steps

---

### Step 2: Assign RBAC Roles

**Script:** `02_assign_roles.sh`

**What it does:**

- Assigns necessary Azure RBAC roles for the managed identity:
  - **AcrPull** - Allows Container App to pull Docker images from ACR
  - **Key Vault Secrets User** - Allows Container App to read secrets

**Requirements:**

- You must have **Owner** or **User Access Administrator** role on the subscription

**Run it:**

```bash
bash scripts/deploy/02_assign_roles/02_assign_roles.sh
```

**Note:** Role assignments take 1-2 minutes to propagate across Azure.

---

### Step 3: Configure Stripe (Optional)

*Note:* You can skip this if you'd like to deploy with stripe still in test mode. 

**Script:** `03_configure_stripe.sh` 

**What it does:**

- Sets up Stripe products for your subscription plans
- Creates products and prices in Stripe (live or test mode)
- Updates `.env.production` with Stripe credentials
- Optionally stores secrets in Azure Key Vault

**Run it:**

```bash
bash scripts/deploy/03_configure_stripe/03_configure_stripe.sh
```

**Interactive prompts:**

- Stripe API keys (secret key and publishable key)
- Product names and pricing
- Optional: Store in Key Vault (`--keyvault` flag) (experimental, untested)

**Skip if:**

- Your app doesn't use Stripe
- You'll configure Stripe manually later

**Update webhook later:**

After Container App is deployed, update your Stripe webhook either manually or you can try (experimental, untested):

```bash
bash scripts/deploy/03_configure_stripe/03_configure_stripe.sh --update-webhook
```

---

### Step 4: Build and Push Docker Image

**Script:** `04_build_and_push_image.sh`

**What it does:**

- Builds your Next.js application as a Docker image
- Injects `NEXT_PUBLIC_*` environment variables at build time
- Pushes the image to Azure Container Registry
- Tags the image (default: `latest`)

**Requirements:**

- Docker must be running
- `.env.production` must exist (from Step 1)

**Run it:**

```bash
bash scripts/deploy/04_build_and_push_image/04_build_and_push_image.sh
```

**Options:**

```bash
# Build with custom tag
bash scripts/deploy/04_build_and_push_image/04_build_and_push_image.sh --tag v1.0.0

# Non-interactive mode
bash scripts/deploy/04_build_and_push_image/04_build_and_push_image.sh --yes
```

**Important notes:**

- `NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build time
- To update these variables, you must rebuild and redeploy the image
- Regular secrets are injected at runtime (no rebuild needed)

---

### Phase 2: Deploy Container App

**Script:** `05_deploy_container_app.sh`

**What it does:**

- Deploys the Azure Container App using the Docker image from Step 4
- Configures ingress and scaling rules
- Updates `.env.production` with the Container App URL
- Verifies deployment health

**Run it:**

```bash
bash scripts/deploy/05_deploy_container_app/05_deploy_container_app.sh
```

**What happens:**

- Creates the Container App resource
- Configures it to use your Docker image from ACR
- Sets up HTTPS ingress with automatic certificate
- Returns the public URL for your application

**Verification:**

The script will test the health endpoint. If it fails, check:

- Container App logs in Azure Portal
- Image exists in ACR
- Managed identity has correct permissions

---

### Step 6: Bind Secrets to Container App

**Script:** `06_bind_secrets.sh`

**What it does:**

- Reads all secrets from `.env.production`
- Stores secrets in Azure Key Vault
- Binds secrets to Container App as Key Vault references
- Updates Container App environment variables

**Requirements:**

- You must have **Key Vault Secrets Officer** role

**Assign the role (Either manually or through az cli)**

**Run it:**

```bash
bash scripts/deploy/06_bind_secrets/06_bind_secrets.sh
```

**What happens:**

- Secrets are stored in Key Vault (encrypted at rest)
- Container App references secrets via managed identity
- Secrets are injected at runtime (no rebuild needed)
- Your application can access them as environment variables

---

## Deployment Complete! 🎉

Your application is now live on Azure. The Container App URL is in your `.env.production` file.

### Next Steps

1. **Test your application** - Visit the Container App URL. You may need to restart your container so that the secret references will take effect.
2. **Configure custom domain** (optional) - Set up custom domain in Azure Portal
3. **Set up monitoring** (optional)- Review Application Insights dashboard
4. **Configure CI/CD** (optional) - Automate deployments with GitHub Actions

### Updating Your Application

**To update code:**
```bash
# Rebuild and push new image
bash scripts/deploy/04_build_and_push_image/04_build_and_push_image.sh --tag v1.1.0

# Deploy new version
bash scripts/deploy/05_deploy_container_app/05_deploy_container_app.sh --tag v1.1.0
```

**To update environment variables:**
```bash
# Edit .env.production
nano .env.production

# If changing NEXT_PUBLIC_* variables (requires rebuild):
bash scripts/deploy/04_build_and_push_image/04_build_and_push_image.sh

# If changing secrets only (no rebuild needed):
bash scripts/deploy/06_bind_secrets/06_bind_secrets.sh
```

**To update Stripe webhook:**
```bash
bash scripts/deploy/03_configure_stripe/03_configure_stripe.sh --update-webhook (EXPERIMENTAL, UNTESTED)
```

---

## Troubleshooting

### Deployment fails with "AcrPull permission denied"

**Solution:** Run the role assignment script again:
```bash
bash scripts/deploy/02_assign_roles/02_assign_roles.sh
```

Wait 2-3 minutes for roles to propagate, then retry deployment.

---

### Container App health check fails

**Check logs:**

```bash
az containerapp logs show \
  --name <your-app-name> \
  --resource-group <your-rg> \
  --follow
```

**Common causes:**

- Missing environment variables
- Database connection issues
- Application startup errors

---

### Docker build fails

**Check common issues:**

- Docker daemon not running
- Insufficient memory allocated to Docker
- Syntax errors in Dockerfile
- Missing dependencies in package.json

**Increase Docker memory:**

- Docker Desktop → Settings → Resources → Memory (increase to 4GB+)

---

## Clean Up Resources (EXPERIMENTAL, UNTESTED)

To delete all Azure resources and avoid charges:

```bash
bash scripts/deploy/99_cleanup_resources/99_cleanup_resources.sh
```

**Warning:** This will delete your entire resource group and all resources. Use with caution!

---
---

## Architecture

The deployment creates:

```

Azure Resource Group
├── Azure SQL Database (serverless)
├── Azure Container Registry (ACR)
├── Azure Key Vault
├── Container Apps Environment
├── Container App
├── Managed Identity
└── Application Insights (optional)

```

**Security:**

- All secrets stored in Key Vault
- Container App uses managed identity (no credentials)
- HTTPS enforced with automatic certificates
- SQL firewall configured for Azure services

**Scalability:**

- Container Apps auto-scale based on HTTP traffic
- SQL Database scales automatically (serverless tier)
- Zero-downtime deployments with rolling updates

---

## Support

For issues or questions:

1. Check [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for architecture details
2. Review [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.MD) for local setup
3. Check Azure Portal for deployment status
4. Review Container App logs for runtime errors

---

**Happy deploying!** 🚀


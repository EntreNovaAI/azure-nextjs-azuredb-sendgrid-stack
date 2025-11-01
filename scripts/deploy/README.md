# Deployment Scripts

This directory contains scripts for deploying the application to **Azure production environment**.

## 📋 Environment Variables Strategy

**IMPORTANT:** The deployment scripts use a smart approach to preserve your development configuration:

### How It Works

1. **Start with `.env.local`**: Your development environment file contains all your settings (Google Auth, MailerSend, Stripe test keys, etc.)

2. **Scripts copy and update**: Each deployment script:
   - Copies `.env.local` → `.env.production` (if it doesn't exist)
   - Updates ONLY the deployment-specific variables
   - Preserves everything else (Google Auth, email service, etc.)

3. **Variables updated by deployment**:
   - Azure SQL Database credentials (from `01_deploy_infrastructure.sh`)
   - Azure Container Registry info (from `01_deploy_infrastructure.sh`)
   - Azure Key Vault info (from `01_deploy_infrastructure.sh`)
   - Stripe production keys (from `03_configure_stripe.sh`)
   - Container App URLs (from `05_deploy_container_app.sh`)
   - NextAuth URL (from `05_deploy_container_app.sh`)

4. **Variables preserved from `.env.local`**:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `MAILERSEND_API_KEY` / `MAILERSEND_FROM_EMAIL`
   - Any other custom environment variables

### Why This Approach?

✅ **No duplicate work**: Google Auth setup done once in `.env.local`  
✅ **Consistency**: Same credentials across dev/prod where appropriate  
✅ **Safety**: Deployment scripts only update what they manage  
✅ **Flexibility**: Easy to override any variable manually in `.env.production`

### Before You Deploy

Make sure your `.env.local` is complete with:
- ✅ Google OAuth credentials
- ✅ MailerSend API key and from email
- ✅ Any other services you use in development

The deployment scripts will handle the Azure-specific variables!

---

## Prerequisites

### Required Tools

- **Azure CLI**: https://docs.microsoft.com/cli/azure/install-azure-cli
  - macOS: `brew install azure-cli`
  - Windows: Download from link above
  - Linux: Package manager or script install
  
- **Bicep CLI**: `az bicep install`

- **Docker Desktop**: https://www.docker.com/products/docker-desktop

- **jq** (recommended): 
  - macOS: `brew install jq`
  - Windows: `choco install jq`
  - Linux: `apt install jq` or `yum install jq`

- **Stripe live account** (activated for production)

### Azure Requirements

- Active Azure subscription
- **Contributor** or **Owner** role on subscription
- Sufficient quota for resources (usually default is fine)

### macOS Users

Run scripts with `bash`:

```bash
bash scripts/deploy/01_az_deploy_infra.sh
```

---

## Deployment Workflow

This project uses a **two-phase deployment strategy** to solve the "chicken and egg" problem where Container Apps need a Docker image, but you need infrastructure to push the image to ACR.

### Phase 1: Foundation Infrastructure

```bash
# 0. Validate prerequisites
bash scripts/deploy/00_validate_prerequisites.sh

# 1. Deploy foundation infrastructure (SQL, ACR, Key Vault, Container Env)
#    NOTE: Container App is NOT deployed yet - no Docker image required!
bash scripts/deploy/01_deploy_infrastructure.sh

# 2. Assign RBAC roles (REQUIRED - managed identity needs ACR access)
bash scripts/deploy/02_assign_roles.sh

# 3. Configure Stripe production (BEFORE building image!)
bash scripts/deploy/03_configure_stripe.sh

# 4. Build and push Docker image to ACR
bash scripts/deploy/04_build_and_push_image.sh
```

### Phase 2: Deploy Container App

```bash
# 5. Deploy Container App (now that Docker image exists in ACR)
bash scripts/deploy/05_deploy_container_app.sh

# 6. Bind secrets to Container App (final step)
bash scripts/deploy/06_bind_secrets.sh

# 7. Verify deployment
curl https://<your-container-app-url>/api/health
```

### Why Two Phases?

**The Problem:** Container Apps require a Docker image to deploy, but you need Azure Container Registry (ACR) to store the image. This creates a circular dependency.

**The Solution:** 
- **Phase 1** deploys all infrastructure EXCEPT the Container App (no image needed)
- Build and push the Docker image to the now-existing ACR
- **Phase 2** deploys the Container App using the image from ACR

**⚠️ Important Notes:**
- Configure Stripe (step 3) BEFORE building Docker image (step 4)
- RBAC roles (step 2) must be assigned BEFORE deploying Container App (step 5)
- Default region is now `eastus2` (better SQL Database availability)

**✨ All scripts work on Windows, macOS, and Linux!**

---

## Scripts

### 0. 00_validate_prerequisites.sh - Prerequisites Validation ✅

Validates all prerequisites before deployment.

**Cross-Platform:** ✅ Windows, macOS, Linux

**Usage:**

```bash
bash scripts/deploy/00_validate_prerequisites.sh
```

**What it checks:**
- Azure CLI installation and version
- Bicep CLI installation
- Docker installation and daemon status
- Azure login status and permissions
- Required files (Bicep templates, Dockerfile)
- Azure resource providers registration
- Environment configuration

**Exit codes:**
- `0`: All checks passed
- `1`: Critical errors found

**When to run:**
- Before first deployment
- After installing/updating tools
- When troubleshooting deployment issues

---

### 1. 01_deploy_infrastructure.sh - Foundation Infrastructure (Phase 1) 🏗️

Deploys foundation Azure infrastructure using Bicep (Phase 1 of two-phase deployment).

**Cross-Platform:** ✅ Windows, macOS, Linux

**Usage:**

```bash
# Interactive mode (recommended)
bash scripts/deploy/01_deploy_infrastructure.sh

# Non-interactive with subscription
bash scripts/deploy/01_deploy_infrastructure.sh --yes --subscription <subscription-id>
```

**What it deploys (Phase 1):**
- Azure SQL Database (Basic tier, ~$5/month)
- Azure Container Registry (Basic, ~$5/month)
- Azure Container Apps Environment (ready for app)
- Managed Identity (for Container App)
- Azure Key Vault (Standard, ~$0.03/10K operations)
- **Optional**: Storage Account, OpenAI, Web PubSub, App Insights

**What it does NOT deploy:**
- ❌ Container App itself (requires Docker image - deployed in Phase 2)

**Parameters collected:**
- Resource group name
- Azure region (default: eastus2)
- Resource name prefix (3-15 lowercase alphanumeric)
- SQL admin username and password
- SQL SKU (Basic, S0, S1, etc.)
- Optional services flags

**Outputs:**
- Creates `.env.production` with foundation resource info
- Container App URL will be added in Phase 2
- Displays next steps

**Duration:** 5-10 minutes

**Cost estimate:** $10-50/month depending on usage and optional services

**Important:**
- Review `what-if` analysis before confirming
- Save SQL admin password securely
- Default region is `eastus2` (better SQL availability than eastus)
- Container App is deployed separately in step 5

---

### 2. 02_assign_roles.sh - Assign RBAC Roles 🔑

Assigns necessary Azure RBAC roles for Container App managed identity.

**Cross-Platform:** ✅ Windows, macOS, Linux

**Usage:**

```bash
# Interactive mode
bash scripts/deploy/02_assign_roles.sh

# Non-interactive
bash scripts/deploy/02_assign_roles.sh --yes
```

**What it assigns:**
- **AcrPull** role on Container Registry → Allows pulling Docker images
- **Key Vault Secrets User** role on Key Vault → Allows reading secrets

**Prerequisites:**
- Run `01_deploy_infrastructure.sh` first
- User must have **Owner** or **User Access Administrator** role

**Why separate script?**
Role assignments require elevated permissions that most Contributor users don't have. This allows infrastructure deployment to succeed even without role assignment permissions.

**Duration:** < 1 minute

**Troubleshooting:**
If you don't have the required permissions:
1. Ask your Azure admin to grant you Owner role on the resource group
2. Or share this script with your admin to run it for you
3. See `docs/DEPLOYMENT_TROUBLESHOOTING.md` for details

---

### 3. 03_configure_stripe.sh - Stripe Production Setup 💳

Sets up Stripe **live mode** products for production.

**Usage:**

```bash
# Store in .env.production (default)
bash scripts/deploy/03_configure_stripe.sh

# Store directly in Key Vault
bash scripts/deploy/03_configure_stripe.sh --keyvault
```

**⚠️ WARNING:** This uses **LIVE MODE** - real payments will be processed!

---

### 4. 04_build_and_push_image.sh - Build and Push Docker Image 🐳

Builds Docker image and pushes it to Azure Container Registry.

**Cross-Platform:** ✅ Windows, macOS, Linux (including Apple Silicon M1/M2/M3)

**Usage:**

```bash
# Build with 'latest' tag
bash scripts/deploy/04_build_and_push_image.sh

# Build with custom tag
bash scripts/deploy/04_build_and_push_image.sh --tag v1.0.0

# Non-interactive mode
bash scripts/deploy/04_build_and_push_image.sh --yes
```

**What it does:**
1. Validates Docker is running
2. Loads configuration from `.env.production`
3. Builds Docker image for `linux/amd64` platform
4. Logs in to Azure Container Registry
5. Pushes image to ACR
6. Optionally updates Container App
7. Optionally cleans up local images

**Platform Notes:**
- **Apple Silicon (M1/M2/M3):** Builds cross-platform for Azure (x86_64)
- **Windows:** Works with Docker Desktop or WSL2
- **Linux:** Works with Docker Engine

**Prerequisites:**
- Docker running (Docker Desktop on Windows/Mac)
- Run `01_deploy_infrastructure.sh` first
- Run `03_configure_stripe.sh` before building (if using Stripe)
- Sufficient disk space (typically 500MB-2GB)

**Duration:** 3-10 minutes (depending on image size and network speed)

**What happens to the old image?**
The script offers to clean up local images to save disk space. Images in ACR are kept (you can manage them via Azure Portal).

**Troubleshooting:**
- **Docker not running:** Start Docker Desktop
- **Build fails:** Check Dockerfile syntax and source files
- **Push fails:** Verify ACR permissions and network connection
- **Platform warnings on ARM Mac:** Normal and expected, image will work on Azure

---

### 5. 05_deploy_container_app.sh - Deploy Container App (Phase 2) 🚀

Deploys the Container App now that the Docker image exists in ACR.

**Cross-Platform:** ✅ Windows, macOS, Linux

**Usage:**

```bash
# Deploy with 'latest' tag
bash scripts/deploy/05_deploy_container_app.sh

# Deploy with specific tag
bash scripts/deploy/05_deploy_container_app.sh --tag v1.0.0

# Non-interactive mode
bash scripts/deploy/05_deploy_container_app.sh --yes
```

**What it does:**
1. Verifies Docker image exists in ACR
2. Checks RBAC roles are assigned
3. Deploys Container App using Bicep
4. Updates `.env.production` with Container App URL
5. Verifies deployment and health check

**Prerequisites:**
- Phase 1 complete (01_deploy_infrastructure.sh)
- RBAC roles assigned (02_assign_roles.sh)
- Docker image pushed to ACR (04_build_and_push_image.sh)

**Duration:** 3-5 minutes

**What gets deployed:**
- Azure Container App (with managed identity)
- Connected to Container Apps Environment
- Configured ingress (HTTPS only, port 3000)
- Health probes for liveness and readiness
- Auto-scaling rules (0-1 replicas by default)

**Important:**
- App may take 1-2 minutes to fully start after deployment
- Health endpoint must respond at `/api/health`
- If deployment fails, check ACR permissions and image existence

---

### 6. 06_bind_secrets.sh - Secrets Management (Final Step) 🔐

Stores secrets in Key Vault and binds them to Container App.

**Usage:**

```bash
# Use .env.production (default)
bash scripts/deploy/06_bind_secrets.sh

# Use custom env file
bash scripts/deploy/06_bind_secrets.sh --env-file .env.custom

# Non-interactive
bash scripts/deploy/06_bind_secrets.sh --yes
```

**What it does:**
1. Parses environment file
2. Identifies secrets vs public variables
3. Stores secrets in Key Vault
4. Creates Key Vault references in Container App
5. Sets environment variables in Container App

**Secrets stored:**
- All variables except those starting with `NEXT_PUBLIC_`
- Includes: SQL credentials, Stripe keys, NextAuth secret, etc.

**Security:**
- Secrets are **never echoed** to console
- Container App accesses secrets via managed identity
- Secrets are encrypted at rest in Key Vault

**When to run:**
- After infrastructure deployment
- After updating Stripe production setup
- Whenever secrets change in `.env.production`

---

### 5. 05_az_get_connection_strings.sh - Retrieve Connection Strings 🔍

Retrieves all connection strings and credentials from Azure.

**Usage:**

```bash
# Auto-detect resource group
bash scripts/deploy/05_az_get_connection_strings.sh

# Specify resource group
bash scripts/deploy/05_az_get_connection_strings.sh --resource-group my-rg
```

**What it retrieves:**
- SQL Server FQDN and database name
- Container App URL
- Key Vault name and URI (with secret list)
- Container Registry login server
- Storage Account connection string (if deployed)
- OpenAI endpoint and key (if deployed)
- Web PubSub connection string (if deployed)
- Application Insights connection string (if deployed)

**Output format:**
- Copy-paste ready for `.env` files
- Kysely-compatible SQL format
- Includes Azure CLI login commands

**When to use:**
- After infrastructure deployment
- When `.env.production` is lost or outdated
- For documentation or troubleshooting
- When setting up additional environments

---

### 6. 06_az_cleanup.sh - Resource Cleanup 🧹

Safely deletes Azure resources to avoid costs.

**Usage:**

```bash
# Interactive cleanup (recommended)
bash scripts/deploy/06_az_cleanup.sh

# Delete entire resource group (fastest)
bash scripts/deploy/06_az_cleanup.sh --delete-rg

# Non-interactive
bash scripts/deploy/06_az_cleanup.sh --yes --resource-group my-rg --delete-rg
```

**Deletion options:**

1. **Entire resource group** (recommended)
   - Fastest method
   - Deletes all resources at once
   - Requires typing "DELETE" to confirm

2. **Selective deletion**
   - Choose which resource types to delete
   - Delete resources in safe order
   - Preserves resources you want to keep

**Deletion order (selective):**
1. Container Apps
2. Container Apps Environment
3. Container Registry
4. SQL Databases
5. SQL Servers
6. Key Vaults (with purge option)
7. Storage Accounts
8. OpenAI Services
9. Web PubSub
10. Application Insights
11. Log Analytics Workspaces

**Important notes:**
- ⚠️ **Data loss is permanent** - backup first!
- Key Vaults have soft-delete (7 days recovery)
- Deletion may take 5-15 minutes
- Uses `--no-wait` for resource group deletion

**When to use:**
- Tearing down test/dev environments
- Cleaning up after failed deployments
- Reducing costs when not using resources
- Before re-deploying with different configuration

---

## Environment Files

### .env.production Structure

Generated by `01_az_deploy_infra.sh`:

```env
# Azure SQL Database
MSSQL_SERVER=<server>.database.windows.net
MSSQL_DATABASE=<database-name>
MSSQL_USER=<admin-user>
MSSQL_PASSWORD=<admin-password>
MSSQL_ENCRYPT=true
MSSQL_POOL_MIN=0
MSSQL_POOL_MAX=10

# NextAuth
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://<container-app-url>

# Azure Resources
KEY_VAULT_NAME=<vault-name>
ACR_LOGIN_SERVER=<registry>.azurecr.io
CONTAINER_APP_NAME=<app-name>

# Stripe (added by 02_stripe_production_setup.sh)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUBSCRIPTION_ID_BASIC=prod_...
STRIPE_SUBSCRIPTION_ID_PREMIUM=prod_...

# Optional Services
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_WEB_PUBSUB_CONNECTION_STRING=...
APPINSIGHTS_CONNECTION_STRING=...
```

---

## Docker Build & Push

### Build Docker Image

```bash
# From project root
docker build -t <acr-name>.azurecr.io/<app-name>:latest -f docker/Dockerfile .

# With build arguments (if needed)
docker build \
  --build-arg NODE_ENV=production \
  -t <acr-name>.azurecr.io/<app-name>:latest \
  -f docker/Dockerfile .
```

### Push to Azure Container Registry

```bash
# Login to ACR
az acr login --name <acr-name>

# Push image
docker push <acr-name>.azurecr.io/<app-name>:latest

# Or use ACR build (builds in Azure)
az acr build \
  --registry <acr-name> \
  --image <app-name>:latest \
  --file docker/Dockerfile \
  .
```

### Update Container App

After pushing new image:

```bash
# Container App will automatically detect and deploy new image
# Or manually trigger update:
az containerapp update \
  --name <app-name> \
  --resource-group <rg-name> \
  --image <acr-name>.azurecr.io/<app-name>:latest
```

---

## Cost Management

### Estimated Monthly Costs (MVP Configuration)

| Resource | SKU | Estimated Cost |
|----------|-----|----------------|
| SQL Database | Basic (5 DTU) | ~$5 |
| Container Registry | Basic | ~$5 |
| Container Apps | Consumption (0-1 replica) | ~$0-10 |
| Key Vault | Standard | ~$0.03/10K ops |
| Log Analytics | Pay-as-you-go | ~$2-5 |
| **Total (core)** | | **~$12-25** |

**Optional services:**
- Storage Account: ~$0.02/GB + transactions
- OpenAI: ~$0.002/1K tokens
- Web PubSub: ~$1/unit/day
- App Insights: Included in free tier for low traffic

### Cost Optimization Tips

1. **Scale to zero**: Container Apps scale to 0 when idle (default in template)
2. **Basic SKUs**: Use Basic tier for non-production (already configured)
3. **Delete when not in use**: Run cleanup script for test environments
4. **Monitor usage**: Use Azure Cost Management + Billing
5. **Set budget alerts**: Create budget in Azure Portal

---

## Security Best Practices

### Secrets Management

✅ **DO:**
- Store all secrets in Azure Key Vault
- Use managed identities for authentication
- Rotate secrets regularly
- Use `--keyvault` flag for Stripe setup
- Never log or display secret values

❌ **DON'T:**
- Commit `.env.production` to version control
- Share secrets via email or chat
- Hard-code secrets in application code
- Use same secrets for dev and prod

### Network Security

For production, consider:
- Private endpoints for SQL Database
- VNet integration for Container Apps
- Key Vault firewall rules
- SQL Server firewall restrictions

### Access Control

- Use **Contributor** role for deployments
- Use **Key Vault Secrets User** for Container App
- Use **AcrPull** role for image pulling
- Implement RBAC for all resources
- Review access regularly

---

## Troubleshooting

### "Deployment failed"

1. Check error message in Azure CLI output
2. Review deployment logs in Azure Portal
3. Verify all parameters are correct
4. Check Azure resource provider registration
5. Verify subscription quotas

### "Bicep validation failed"

```bash
# Lint Bicep template
az bicep build --file infrastructure/bicep/main.bicep

# Check for syntax errors
az deployment group what-if \
  --resource-group <rg> \
  --template-file infrastructure/bicep/main.bicep
```

### "Container App not starting"

1. Check Container App logs in Azure Portal
2. Verify all environment variables are set
3. Check if image was pushed successfully
4. Verify managed identity has Key Vault access
5. Test health endpoint: `/api/health`

### "Database connection failed"

1. Verify SQL Server firewall allows Azure services
2. Check connection string format (Kysely compatible)
3. Verify SQL credentials are correct
4. Test connection from Container App logs
5. Check if database was created

### "Secrets not accessible"

1. Verify Container App managed identity exists
2. Check Key Vault RBAC role assignments
3. Verify secrets are stored in Key Vault
4. Check secret names (underscores vs dashes)
5. Review Container App environment configuration

### "Docker build fails"

1. Check Dockerfile syntax
2. Verify all source files exist
3. Check `.dockerignore` isn't excluding needed files
4. Try building locally first
5. Review build logs for specific errors

---

## Monitoring & Observability

### Application Insights (if deployed)

```bash
# View Container App logs
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg> \
  --follow

# Query Application Insights
az monitor app-insights query \
  --app <app-name> \
  --analytics-query "requests | take 10"
```

### Health Checks

```bash
# Check app health
curl https://<container-app-url>/api/health

# Should return:
# {"status": "ok"}
```

### Metrics to Monitor

- Container App: Requests, Replicas, CPU, Memory
- SQL Database: DTU usage, Connection count
- Key Vault: API latency, Availability
- Stripe: Payment success rate, Webhook delivery

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Build and Push
        run: |
          az acr build \
            --registry ${{ secrets.ACR_NAME }} \
            --image ${{ secrets.APP_NAME }}:${{ github.sha }} \
            --file docker/Dockerfile \
            .
      
      - name: Update Container App
        run: |
          az containerapp update \
            --name ${{ secrets.APP_NAME }} \
            --resource-group ${{ secrets.RESOURCE_GROUP }} \
            --image ${{ secrets.ACR_NAME }}.azurecr.io/${{ secrets.APP_NAME }}:${{ github.sha }}
```

---

## Related Documentation

- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Azure Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Key Vault](https://learn.microsoft.com/azure/key-vault/)
- [Stripe Production Checklist](https://stripe.com/docs/testing)

---

## Support

For issues or questions:
1. Check error messages in Azure Portal
2. Review script output carefully
3. Verify all prerequisites are met
4. Run validation script first
5. Check Azure service health status

---

**Ready to deploy? Start with:** `bash scripts/deploy/04_az_validate_setup.sh`


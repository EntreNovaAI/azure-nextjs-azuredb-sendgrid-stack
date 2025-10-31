# Deployment Guide

Complete guide for deploying the Azure Next.js Stack with Stripe integration.

## 🚀 Quick Start

### Development Setup (5 minutes)

```bash
# 1. Set up Stripe test mode
bash scripts/dev/01_stripe_setup.sh

# 2. Start development server with tunnel (for webhooks)
bash scripts/dev/dev_with_tunnel.sh
```

### Production Deployment (30-45 minutes)

```bash
# 1. Validate prerequisites
bash scripts/deploy/04_az_validate_setup.sh

# 2. Deploy Azure infrastructure
bash scripts/deploy/01_az_deploy_infra.sh

# 3. Set up Stripe production
bash scripts/deploy/02_stripe_production_setup.sh

# 4. Build and push Docker image
docker build -t <acr-name>.azurecr.io/<app-name>:latest -f docker/Dockerfile .
az acr login --name <acr-name>
docker push <acr-name>.azurecr.io/<app-name>:latest

# 5. Bind secrets to Container App
bash scripts/deploy/03_az_bind_secrets.sh

# 6. Verify deployment
curl https://<your-container-app-url>/api/health
```

---

## 📁 Repository Structure

```
.
├── scripts/
│   ├── dev/                           # Development scripts
│   │   ├── 01_stripe_setup.sh        # Stripe test mode setup
│   │   ├── dev_with_tunnel.sh        # Dev server with tunnel
│   │   └── README.md                 # Development documentation
│   │
│   └── deploy/                        # Production deployment scripts
│       ├── 01_az_deploy_infra.sh     # Azure infrastructure deployment
│       ├── 02_stripe_production_setup.sh  # Stripe live mode setup
│       ├── 03_az_bind_secrets.sh     # Secrets management
│       ├── 04_az_validate_setup.sh   # Prerequisites validation
│       ├── 05_az_get_connection_strings.sh  # Retrieve connection strings
│       ├── 06_az_cleanup.sh          # Resource cleanup
│       └── README.md                 # Deployment documentation
│
├── infrastructure/
│   └── bicep/                         # Infrastructure as Code
│       ├── main.bicep                # Main orchestration template
│       ├── modules/                  # Modular Bicep templates
│       │   ├── sql.bicep            # Azure SQL Database
│       │   ├── acr.bicep            # Container Registry
│       │   ├── keyvault.bicep       # Key Vault
│       │   ├── container-apps-env.bicep  # Container Apps Environment
│       │   ├── container-app.bicep  # Container App
│       │   ├── role-assignment.bicep  # RBAC assignments
│       │   ├── storage.bicep        # Storage Account (optional)
│       │   ├── openai.bicep         # OpenAI Service (optional)
│       │   ├── webpubsub.bicep      # Web PubSub (optional)
│       │   └── monitoring.bicep     # App Insights & Log Analytics
│       └── README.md                 # Infrastructure documentation
│
└── DEPLOYMENT.md                      # This file
```

---

## 🎯 Architecture

### Development Environment

```
┌─────────────────┐      ┌──────────────┐
│  Local Machine  │─────►│ Stripe Test  │
│  (Next.js Dev)  │      │     API      │
└─────────────────┘      └──────────────┘
        │
        │ (Tunnel)
        ▼
┌─────────────────┐
│  Public URL     │◄────── Stripe Webhooks
│  (ngrok/Azure)  │
└─────────────────┘
```

### Production Environment (Azure)

```
                   Internet
                      │
                      ▼
            ┌─────────────────┐
            │  Container App  │
            │   (Next.js)     │
            └─────────────────┘
                 │    │    │
         ┌───────┘    │    └───────┐
         ▼            ▼            ▼
    ┌────────┐  ┌──────────┐  ┌────────┐
    │  SQL   │  │Key Vault │  │  ACR   │
    │Database│  │(Secrets) │  │(Docker)│
    └────────┘  └──────────┘  └────────┘
```

---

## 🛠️ Prerequisites

### Tools Required

| Tool | Purpose | Installation |
|------|---------|-------------|
| **Azure CLI** | Azure resource management | [Install Guide](https://docs.microsoft.com/cli/azure/install-azure-cli) |
| **Bicep CLI** | Infrastructure deployment | `az bicep install` |
| **Docker** | Container builds | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| **Node.js 18+** | Application runtime | [nodejs.org](https://nodejs.org/) |
| **pnpm** | Package manager | `npm install -g pnpm` |
| **jq** (optional) | JSON parsing | `brew install jq` (macOS) |
| **Stripe CLI** (optional) | Stripe testing | [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) |

### Azure Requirements

- ✅ Active Azure subscription
- ✅ **Contributor** or **Owner** role
- ✅ Sufficient resource quotas (default is usually fine)
- ✅ Resource providers registered (auto-registered on first use)

### Stripe Requirements

- ✅ Stripe account (free to create)
- ✅ Test mode API keys (for development)
- ✅ Live mode activated (for production)
- ✅ Business verification completed (for live mode)

---

## 📖 Step-by-Step Guide

### Phase 1: Development Setup

#### 1.1 Initial Configuration

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd azure-nextjs-azuredb-sendgrid-stack

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
```

#### 1.2 Set Up Stripe Test Mode

```bash
# Run Stripe setup script
bash scripts/dev/01_stripe_setup.sh
```

**What you'll need:**
- Stripe test secret key from https://dashboard.stripe.com/test/apikeys
- Stripe test publishable key

**What it creates:**
- Two subscription products (Basic $9.99, Premium $29.99)
- Updates `.env.local` with test credentials

#### 1.3 Configure Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `http://localhost:3000/api/stripe/webhooks` (or tunnel URL)
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy webhook signing secret
6. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`

#### 1.4 Start Development Server

```bash
# With tunnel (for webhook testing)
bash scripts/dev/dev_with_tunnel.sh

# Or standard dev server
pnpm run dev
```

#### 1.5 Test the Application

- **Local**: http://localhost:3000
- **Tunnel**: https://xxx.ngrok.io (shown in terminal)
- **Test payment**: Use card `4242 4242 4242 4242`

---

### Phase 2: Production Deployment

#### 2.1 Validate Prerequisites

```bash
# Run validation script
bash scripts/deploy/04_az_validate_setup.sh
```

This checks:
- ✅ All required tools installed
- ✅ Azure CLI authenticated
- ✅ Docker daemon running
- ✅ Bicep templates valid
- ✅ Resource providers registered

**Fix any errors before proceeding!**

#### 2.2 Deploy Azure Infrastructure

```bash
# Login to Azure (if not already)
az login

# Run infrastructure deployment
bash scripts/deploy/01_az_deploy_infra.sh
```

**Information required:**
- Resource group name (e.g., `myapp-prod-rg`)
- Azure region (e.g., `eastus`)
- Resource prefix (e.g., `myapp`)
- SQL admin username and password
- Optional services (Storage, OpenAI, Web PubSub)

**What it deploys:**
- ✅ Azure SQL Database (Basic tier)
- ✅ Container Registry
- ✅ Container Apps (Environment + App)
- ✅ Key Vault
- ✅ Application Insights (optional)
- ✅ RBAC role assignments

**Outputs:**
- `.env.production` file with all connection strings
- Resource names and URLs
- Next steps instructions

**Duration:** 5-10 minutes

#### 2.3 Set Up Stripe Production

```bash
# Run Stripe production setup
bash scripts/deploy/02_stripe_production_setup.sh
```

**⚠️ WARNING: This uses LIVE MODE - real payments!**

**What you'll need:**
- Stripe **live** secret key from https://dashboard.stripe.com/apikeys
- Stripe **live** publishable key
- Confirmation that your account is activated

**What it creates:**
- Live subscription products (Basic and Premium)
- Updates `.env.production` with live credentials

**After setup:**
1. Configure production webhook: https://dashboard.stripe.com/webhooks
2. URL: `https://<your-container-app-url>/api/stripe/webhooks`
3. Select same events as test mode
4. Add `STRIPE_WEBHOOK_SECRET` to `.env.production`

#### 2.4 Build and Push Docker Image

```bash
# Get ACR name from .env.production
ACR_NAME=$(grep "^ACR_NAME=" .env.production | cut -d'=' -f2)
APP_NAME=$(grep "^CONTAINER_APP_NAME=" .env.production | cut -d'=' -f2)

# Build Docker image
docker build -t ${ACR_NAME}.azurecr.io/${APP_NAME}:latest -f docker/Dockerfile .

# Login to Azure Container Registry
az acr login --name ${ACR_NAME}

# Push image
docker push ${ACR_NAME}.azurecr.io/${APP_NAME}:latest
```

**Alternative: Build in Azure**

```bash
# Build directly in Azure (no local Docker needed)
az acr build \
  --registry ${ACR_NAME} \
  --image ${APP_NAME}:latest \
  --file docker/Dockerfile \
  .
```

#### 2.5 Bind Secrets to Container App

```bash
# Run secrets binding script
bash scripts/deploy/03_az_bind_secrets.sh
```

**What it does:**
1. Reads secrets from `.env.production`
2. Stores secrets in Key Vault
3. Creates Key Vault references in Container App
4. Sets environment variables

**Result:**
- All secrets securely stored in Key Vault
- Container App accesses via managed identity
- Public variables set directly in Container App

#### 2.6 Verify Deployment

```bash
# Get Container App URL
APP_URL=$(grep "^CONTAINER_APP_URL=" .env.production | cut -d'=' -f2)

# Test health endpoint
curl ${APP_URL}/api/health

# Expected response: {"status":"ok"}

# Visit in browser
echo "Open: ${APP_URL}"
```

**Check logs:**

```bash
# View Container App logs
az containerapp logs show \
  --name ${APP_NAME} \
  --resource-group <rg-name> \
  --follow
```

---

### Phase 3: Ongoing Operations

#### Retrieve Connection Strings

```bash
# Get all connection strings
bash scripts/deploy/05_az_get_connection_strings.sh
```

Use this when:
- `.env.production` is lost or outdated
- Setting up new environment
- Documenting configuration

#### Update Application

```bash
# 1. Make code changes
git pull origin main

# 2. Build and push new image
docker build -t ${ACR_NAME}.azurecr.io/${APP_NAME}:latest -f docker/Dockerfile .
docker push ${ACR_NAME}.azurecr.io/${APP_NAME}:latest

# 3. Container App auto-updates within minutes
# Or force immediate update:
az containerapp update \
  --name ${APP_NAME} \
  --resource-group <rg-name> \
  --image ${ACR_NAME}.azurecr.io/${APP_NAME}:latest
```

#### Update Secrets

```bash
# 1. Update .env.production with new values

# 2. Re-run secrets binding
bash scripts/deploy/03_az_bind_secrets.sh

# 3. Restart Container App
az containerapp restart \
  --name ${APP_NAME} \
  --resource-group <rg-name>
```

#### Clean Up Resources

```bash
# Interactive cleanup (selective)
bash scripts/deploy/06_az_cleanup.sh

# Delete entire resource group (fastest)
bash scripts/deploy/06_az_cleanup.sh --delete-rg

# Non-interactive
bash scripts/deploy/06_az_cleanup.sh --yes --delete-rg
```

---

## 💰 Cost Breakdown

### MVP Configuration (Low Traffic)

| Resource | Configuration | Est. Monthly Cost |
|----------|--------------|-------------------|
| SQL Database | Basic (5 DTU) | $5 |
| Container Registry | Basic | $5 |
| Container Apps | Consumption (0-1 replica) | $0-10 |
| Key Vault | Standard | $0.03/10K ops |
| Log Analytics | Pay-as-you-go | $2-5 |
| **Total** | | **$12-25** |

### With Optional Services

| Service | Configuration | Est. Monthly Cost |
|---------|--------------|-------------------|
| Storage Account | Standard LRS | $0.02/GB + transactions |
| OpenAI | GPT-3.5 Turbo | $0.002/1K tokens |
| Web PubSub | Free tier | $0 (or $1/unit/day for Standard) |

### Cost Optimization Tips

1. **Scale to zero**: Container Apps automatically scale to 0 when idle
2. **Use Basic tiers**: Non-production workloads don't need premium features
3. **Delete when not in use**: Use cleanup script for test environments
4. **Set budget alerts**: Configure in Azure Cost Management
5. **Monitor usage**: Review Azure Cost Analysis regularly

---

## 🔒 Security Checklist

### Development

- [x] Use test mode keys only
- [x] Never commit `.env.local` to git
- [x] Keep dependencies updated
- [x] Use HTTPS tunnel for webhooks
- [x] Test with test card numbers only

### Production

- [x] Use live mode keys only in production
- [x] Never commit `.env.production` to git
- [x] Store all secrets in Key Vault
- [x] Use managed identities (no credentials in code)
- [x] Enable HTTPS only on Container App
- [x] Review RBAC permissions regularly
- [x] Enable Application Insights monitoring
- [x] Set up Azure Security Center alerts
- [x] Configure Stripe webhook verification
- [x] Test webhook signature validation
- [x] Enable SQL Server audit logging
- [x] Rotate secrets regularly

### Recommended Enhancements

For production at scale:
- [ ] Private endpoints for SQL and Key Vault
- [ ] VNet integration for Container Apps
- [ ] SQL Server IP firewall restrictions
- [ ] Azure Front Door or CDN
- [ ] Azure DDoS Protection
- [ ] Multi-region deployment
- [ ] Automated backup strategy
- [ ] Disaster recovery plan

---

## 🔧 Troubleshooting

### Common Issues

#### "Azure CLI not found"
```bash
# Install Azure CLI
# macOS:
brew install azure-cli

# Windows: Download from
https://docs.microsoft.com/cli/azure/install-azure-cli-windows

# Linux:
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### "Not logged in to Azure"
```bash
az login
```

#### "Bicep validation failed"
```bash
# Update Bicep CLI
az bicep upgrade

# Lint template
az bicep build --file infrastructure/bicep/main.bicep
```

#### "Docker daemon not running"
- Start Docker Desktop
- Wait for Docker to fully initialize
- Test: `docker info`

#### "Container App not starting"
```bash
# Check logs
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --follow

# Common causes:
# - Missing environment variables
# - Invalid database connection
# - Image not found in ACR
# - Health check failing
```

#### "Database connection failed"
```bash
# Verify SQL Server firewall
az sql server firewall-rule list \
  --server <server-name> \
  --resource-group <rg-name>

# Ensure "AllowAzureServices" rule exists
# Test connection string format in .env.production
```

#### "Secrets not accessible"
```bash
# Verify Container App has Key Vault role
az role assignment list \
  --assignee <managed-identity-id> \
  --scope <key-vault-id>

# Should show "Key Vault Secrets User" role
```

### Getting Help

1. **Check script output**: Error messages usually indicate the issue
2. **Review Azure Portal**: Check deployment logs and resource status
3. **Use validation script**: `bash scripts/deploy/04_az_validate_setup.sh`
4. **Check documentation**: See README files in each directory
5. **Azure Support**: Create support ticket in Azure Portal

---

## 📚 Documentation

- **Development**: [scripts/dev/README.md](scripts/dev/README.md)
- **Deployment**: [scripts/deploy/README.md](scripts/deploy/README.md)
- **Infrastructure**: [infrastructure/bicep/README.md](infrastructure/bicep/README.md)
- **Main README**: [README.md](README.md)

## 🔗 External Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] All tools installed and updated
- [ ] Azure CLI authenticated
- [ ] Docker Desktop running
- [ ] Stripe account set up
- [ ] Code tested locally
- [ ] Environment variables configured

### Infrastructure

- [ ] Prerequisites validated (`04_az_validate_setup.sh`)
- [ ] Azure infrastructure deployed (`01_az_deploy_infra.sh`)
- [ ] `.env.production` created and reviewed
- [ ] SQL admin password saved securely

### Application

- [ ] Stripe production configured (`02_stripe_production_setup.sh`)
- [ ] Production webhook created in Stripe Dashboard
- [ ] Docker image built and pushed
- [ ] Secrets bound to Container App (`03_az_bind_secrets.sh`)
- [ ] Health endpoint responding
- [ ] Application tested in production

### Post-Deployment

- [ ] Test user registration and login
- [ ] Test subscription purchases
- [ ] Verify webhook events received
- [ ] Check Application Insights logs
- [ ] Set up Azure cost alerts
- [ ] Document any custom configuration
- [ ] Create backup/recovery plan

---

**Need help?** Review the documentation in each directory or check Azure Portal for detailed logs.

**Ready to deploy?** Start with `bash scripts/deploy/04_az_validate_setup.sh`

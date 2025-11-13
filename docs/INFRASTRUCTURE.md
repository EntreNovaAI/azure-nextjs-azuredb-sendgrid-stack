# Azure Infrastructure (Bicep)

This directory contains **Infrastructure as Code** (IaC) templates using Azure Bicep for deploying the complete application stack to Azure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Subscription                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Resource Group                             │ │
│  │                                                          │ │
│  │  ┌──────────────┐      ┌──────────────┐                │ │
│  │  │   SQL        │      │  Container   │                │ │
│  │  │   Database   │◄─────│  App         │◄──┐            │ │
│  │  └──────────────┘      └──────────────┘   │            │ │
│  │                             │              │            │ │
│  │                             │              │            │ │
│  │  ┌──────────────┐      ┌──────────────┐   │            │ │
│  │  │   Key Vault  │      │     ACR      │   │            │ │
│  │  │  (Secrets)   │──────│  (Docker)    │───┘            │ │
│  │  └──────────────┘      └──────────────┘                │ │
│  │                                                          │ │
│  │  Optional Services:                                     │ │
│  │  • Storage Account     • OpenAI                         │ │
│  │  • Web PubSub          • App Insights                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```

infrastructure/bicep/
├── main-foundation.bicep       # Phase 1: Foundation infrastructure
├── main-app.bicep              # Phase 2: Container App deployment
├── modules/                    # Modular resource definitions
│   ├── sql.bicep              # Azure SQL Database
│   ├── acr.bicep              # Azure Container Registry
│   ├── keyvault.bicep         # Azure Key Vault
│   ├── container-apps-env.bicep  # Container Apps Environment
│   ├── container-app.bicep    # Container App
│   ├── role-assignment.bicep  # RBAC role assignments
│   ├── storage.bicep          # Storage Account (optional)
│   ├── openai.bicep           # OpenAI Service (optional)
│   ├── webpubsub.bicep        # Web PubSub (optional)
│   └── monitoring.bicep       # App Insights & Log Analytics (optional)
└── README.md                   # This file
```

## Deployment Strategy

This project uses a **two-phase deployment** approach:

### Phase 1: Foundation Infrastructure (`main-foundation.bicep`)

Deploys all infrastructure **except** the Container App:

- Azure SQL Database
- Azure Container Registry (ACR)
- Azure Key Vault
- Container Apps Environment
- Managed Identity for Container App
- Optional: Storage, OpenAI, Web PubSub, Application Insights

**Why?** You need ACR before you can build and push a Docker image.

### Phase 2: Container App (`main-app.bicep`)

Deploys only the Container App after the Docker image is built and pushed to ACR.

**Usage:** See deployment scripts in `scripts/deploy/`

## Core Resources

### 1. Azure SQL Database (`modules/sql.bicep`)

**Purpose:** Relational database for application data

**Configuration:**

- **SKU**: Basic (5 DTU) - configurable via parameter
- **Size**: 2 GB
- **TLS**: Minimum 1.2
- **Firewall**: Allows Azure services
- **Collation**: SQL_Latin1_General_CP1_CI_AS

**Parameters:**

- `sqlServerName`: Unique server name
- `sqlDatabaseName`: Database name
- `administratorLogin`: Admin username
- `administratorPassword`: Admin password (secure)
- `databaseSku`: SKU (Basic, S0, S1, S2, S3)

**Outputs:**

- `sqlServerFqdn`: Fully qualified domain name
- `sqlDatabaseName`: Database name
- `sqlServerName`: Server name

**Cost:** ~$5/month (Basic tier)

---

### 2. Azure Container Registry (`modules/acr.bicep`)

**Purpose:** Private Docker image registry

**Configuration:**

- **SKU**: Basic
- **Admin user**: Disabled (uses managed identity)
- **Public access**: Enabled (for MVP)
- **Zone redundancy**: Disabled

**Parameters:**

- `acrName`: Unique registry name (alphanumeric only)

**Outputs:**

- `loginServer`: Registry login server URL
- `acrName`: Registry name
- `acrId`: Resource ID

**Cost:** ~$5/month

---

### 3. Azure Key Vault (`modules/keyvault.bicep`)

**Purpose:** Secure secrets management

**Configuration:**

- **SKU**: Standard
- **RBAC**: Enabled (no access policies)
- **Soft delete**: Enabled (7 days retention)
- **Purge protection**: Enabled
- **Public access**: Enabled (for MVP)

**Parameters:**

- `keyVaultName`: Unique vault name

**Outputs:**

- `keyVaultName`: Vault name
- `keyVaultUri`: Vault URI
- `keyVaultId`: Resource ID

**Cost:** ~$0.03 per 10,000 operations

---

### 4. Container Apps Environment (`modules/container-apps-env.bicep`)

**Purpose:** Hosting environment for Container Apps

**Configuration:**

- **Zone redundancy**: Disabled (cost optimization)
- **Logs**: Integrated with Log Analytics (optional)

**Parameters:**

- `environmentName`: Environment name
- `logAnalyticsWorkspaceId`: Log Analytics workspace ID (optional)

**Outputs:**

- `environmentId`: Environment resource ID
- `environmentName`: Environment name

**Cost:** Included in Container App costs

---

### 5. Container App (`modules/container-app.bicep`)

**Purpose:** Serverless container hosting

**Configuration:**
- **Identity**: User-assigned managed identity
- **Ingress**: HTTPS only, port 3000
- **Resources**: 0.25 vCPU, 0.5 Gi memory
- **Scale**: 0-1 replicas (scale to zero)
- **Revision mode**: Single
- **Probes**: Liveness and readiness on `/api/health`

**Parameters:**
- `containerAppName`: App name
- `containerAppEnvId`: Environment ID
- `acrLoginServer`: ACR login server
- `containerImageTag`: Image tag (default: latest)
- `keyVaultName`: Key Vault name
- `appInsightsConnectionString`: App Insights connection (optional)

**Outputs:**
- `containerAppName`: App name
- `containerAppFqdn`: App FQDN
- `containerAppPrincipalId`: Managed identity principal ID
- `containerAppId`: Resource ID

**Cost:** ~$0-10/month (consumption-based)

---

### 6. Role Assignments (`modules/role-assignment.bicep`)

**Purpose:** RBAC permissions for managed identity

**Roles assigned:**
- **AcrPull**: Allows Container App to pull images from ACR
- **Key Vault Secrets User**: Allows Container App to read secrets

**Parameters:**
- `principalId`: Managed identity principal ID
- `roleDefinitionId`: Role definition resource ID
- `targetResourceId`: Target resource ID

---

## Optional Resources

### Storage Account (`modules/storage.bicep`)

**Purpose:** Blob storage for files/assets

**Configuration:**
- **SKU**: Standard_LRS
- **Kind**: StorageV2
- **Access tier**: Hot
- **TLS**: Minimum 1.2
- **Public blob access**: Disabled

**Cost:** ~$0.02/GB + transactions

---

### OpenAI Service (`modules/openai.bicep`)

**Purpose:** Azure OpenAI API access

**Configuration:**
- **SKU**: S0
- **Model**: gpt-35-turbo
- **Capacity**: 10K tokens/min

**Requirements:**
- OpenAI service must be enabled in subscription
- Region must support OpenAI

**Cost:** ~$0.002 per 1K tokens

---

### Web PubSub (`modules/webpubsub.bicep`)

**Purpose:** Real-time messaging

**Configuration:**
- **SKU**: Free_F1 or Standard_S1
- **Capacity**: 1 unit

**Cost:** Free tier available, Standard ~$1/unit/day

---

### Monitoring (`modules/monitoring.bicep`)

**Purpose:** Application monitoring and logging

**Components:**
- Log Analytics Workspace
- Application Insights

**Configuration:**
- **Retention**: 30 days (configurable)
- **SKU**: PerGB2018 (pay-as-you-go)

**Cost:** ~$2-5/month (low traffic)

---

## Outputs

The main template outputs all necessary information for `.env.production`:

```bicep
// Core outputs
output sqlServerFqdn string
output sqlDatabaseName string
output acrLoginServer string
output containerAppName string
output containerAppFqdn string
output containerAppUrl string
output keyVaultName string

// Optional outputs
output storageConnectionString string         // if deployStorage
output openAIEndpoint string                  // if deployOpenAI
output webPubSubConnectionString string       // if deployWebPubSub
output appInsightsConnectionString string     // if deployMonitoring
```

---

## Naming Convention

All resources follow this pattern:

```
{prefix}-{resource-type}-{unique-suffix}
```

**Examples:**
- SQL Server: `myapp-sql-abc123`
- Container App: `myapp-app`
- Key Vault: `myapp-kv-abc123`
- ACR: `myappacrabc123` (no dashes for ACR)

**Unique suffix:**
- Generated using `uniqueString(resourceGroup().id)`
- Ensures global uniqueness for resources requiring it
- Consistent across deployments to same resource group

---

## Security

### Managed Identity

- **Container App** uses user-assigned managed identity
- No credentials stored in code or configuration
- Automatically rotated by Azure

### RBAC Roles

- **AcrPull**: Pull images from Container Registry
- **Key Vault Secrets User**: Read secrets from Key Vault
- **No admin access**: Follows principle of least privilege

### Network Security (MVP)

Current configuration (for cost/simplicity):
- ✅ All resources publicly accessible
- ✅ SQL Server allows Azure services
- ✅ HTTPS enforced on Container App

Production recommendations:
- 🔒 Private endpoints for SQL and Key Vault
- 🔒 VNet integration for Container Apps
- 🔒 SQL Server firewall restrictions
- 🔒 Key Vault network rules

### Secrets Management

- All secrets stored in Key Vault
- Referenced by Container App via managed identity
- Never exposed in Bicep outputs (except via secure parameters)
- Rotation supported through Key Vault

---

## Best Practices

### 1. Modular Design

Each resource is a separate module:
- ✅ Easy to understand and maintain
- ✅ Reusable across projects
- ✅ Testable independently
- ✅ Clear dependencies


### 2. Outputs for Automation

All necessary values output for:
- `.env.production` generation
- CI/CD pipeline integration
- Documentation and troubleshooting

### 3. Cost Optimization

- Basic/Standard SKUs for non-critical workloads
- Scale-to-zero enabled for Container Apps
- No zone redundancy in MVP
- Optional services disabled by default

### 4. Idempotency

- Bicep deployments are idempotent
- Safe to re-run without duplicating resources
- Updates existing resources when possible

---

## Customization


### Add Custom Module

1. Create new file in `modules/`
2. Add module reference in `main-foundation.bicep`:

```bicep
module customResource 'modules/custom.bicep' = {
  name: 'customResourceDeployment'
  params: {
    location: location
    // ... other params
  }
}
```

3. Add outputs if needed:

```bicep
output customResourceId string = customResource.outputs.resourceId
```

### Modify Container App Resources

In `modules/container-app.bicep`:

```bicep
resources: {
  cpu: json('0.5')      // Increase from 0.25
  memory: '1Gi'         // Increase from 0.5Gi
}

scale: {
  minReplicas: 1        // Change from 0 (no scale-to-zero)
  maxReplicas: 3        // Increase from 1
}
```

---



### Bicep Version Issues

```bash
# Update Bicep CLI
az bicep upgrade

# Check version
az bicep version
```

---

---

**Ready to deploy?** Use `bash scripts/deploy/01_deploy_infrastructure/01_deploy_infrastructure.sh`


// ============================================================================
// Foundation Bicep Template - Phase 1 Deployment
// ============================================================================
//
// Purpose:
//   Deploy foundation Azure infrastructure (everything except Container App)
//   This allows infrastructure to be created before Docker image exists
//
// Resources Deployed:
//   ✓ Azure SQL Database (Basic tier for cost-efficiency)
//   ✓ Azure Container Registry (for Docker images)
//   ✓ Azure Key Vault (secrets management with RBAC)
//   ✓ Container Apps Environment (ready for app deployment)
//   ✓ Managed Identity (for Container App)
//   ✓ Optional: Storage Account, OpenAI, Web PubSub, Application Insights
//
// NOT Deployed in Phase 1:
//   ✗ Container App (deployed in Phase 2 after image is built)
//
// Usage:
//   az deployment group create \
//     --resource-group <rg-name> \
//     --template-file main-foundation.bicep \
//     --parameters prefix=<prefix> location=<location>
//
// Next Steps:
//   After this deployment:
//   1. Assign RBAC roles (02_assign_roles.sh)
//   2. Configure Stripe (03_configure_stripe.sh)
//   3. Build & push Docker image (04_build_and_push_image.sh)
//   4. Deploy Container App (05_deploy_container_app.sh)
//

// ============================================================================
// Parameters
// ============================================================================

@description('Prefix for all resource names (3-15 lowercase alphanumeric characters)')
@minLength(3)
@maxLength(15)
param prefix string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('SQL Server administrator username')
@minLength(1)
param sqlAdminUsername string

@description('SQL Server administrator password')
@minLength(8)
@secure()
param sqlAdminPassword string

@description('SQL Database SKU (Basic, S0, S1, etc.)')
@allowed([
  'Basic'
  'S0'
  'S1'
  'S2'
  'S3'
])
param sqlDatabaseSku string = 'Basic'

@description('Deploy Azure Storage Account')
param deployStorage bool = false

@description('Deploy Azure OpenAI Service')
param deployOpenAI bool = false

@description('Deploy Azure Web PubSub Service')
param deployWebPubSub bool = false

@description('Deploy Application Insights monitoring')
param deployMonitoring bool = true

// ============================================================================
// Variables
// ============================================================================

// Generate short unique suffix (5 chars) for resource naming
// This keeps total names within Azure limits (e.g., Key Vault: 24 chars max)
var uniqueSuffix = substring(uniqueString(resourceGroup().id), 0, 5)

// Naming convention: {prefix}-{resource-type}-{suffix}
var sqlServerName = '${prefix}-sql-${uniqueSuffix}'
var sqlDatabaseName = '${prefix}-db'
var acrName = '${prefix}acr${uniqueSuffix}'
var keyVaultName = '${prefix}-kv-${uniqueSuffix}'
var containerAppEnvName = '${prefix}-env-${uniqueSuffix}'
var containerAppName = '${prefix}-app'
var storageAccountName = '${prefix}st${uniqueSuffix}'
var openAIAccountName = '${prefix}-openai-${uniqueSuffix}'
var webPubSubName = '${prefix}-pubsub-${uniqueSuffix}'
var logAnalyticsName = '${prefix}-logs-${uniqueSuffix}'
var appInsightsName = '${prefix}-insights-${uniqueSuffix}'

// ============================================================================
// Module: Azure SQL Database
// ============================================================================

module sqlDatabase 'modules/sql.bicep' = {
  name: 'sqlDatabaseDeployment'
  params: {
    location: location
    sqlServerName: sqlServerName
    sqlDatabaseName: sqlDatabaseName
    administratorLogin: sqlAdminUsername
    administratorPassword: sqlAdminPassword
    databaseSku: sqlDatabaseSku
  }
}

// ============================================================================
// Module: Azure Container Registry
// ============================================================================

module containerRegistry 'modules/acr.bicep' = {
  name: 'containerRegistryDeployment'
  params: {
    location: location
    acrName: acrName
  }
}

// ============================================================================
// Module: Azure Key Vault
// ============================================================================

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVaultDeployment'
  params: {
    location: location
    keyVaultName: keyVaultName
  }
}

// ============================================================================
// Module: Azure Storage Account (Optional)
// ============================================================================

module storageAccount 'modules/storage.bicep' = if (deployStorage) {
  name: 'storageAccountDeployment'
  params: {
    location: location
    storageAccountName: storageAccountName
  }
}

// ============================================================================
// Module: Azure OpenAI (Optional)
// ============================================================================

module openAI 'modules/openai.bicep' = if (deployOpenAI) {
  name: 'openAIDeployment'
  params: {
    location: location
    openAIAccountName: openAIAccountName
  }
}

// ============================================================================
// Module: Azure Web PubSub (Optional)
// ============================================================================

module webPubSub 'modules/webpubsub.bicep' = if (deployWebPubSub) {
  name: 'webPubSubDeployment'
  params: {
    location: location
    webPubSubName: webPubSubName
  }
}

// ============================================================================
// Module: Application Insights (Optional but Recommended)
// ============================================================================

module monitoring 'modules/monitoring.bicep' = if (deployMonitoring) {
  name: 'monitoringDeployment'
  params: {
    location: location
    logAnalyticsName: logAnalyticsName
    appInsightsName: appInsightsName
  }
}

// ============================================================================
// Module: Container Apps Environment
// ============================================================================
// Note: We create the environment here, but the Container App itself
// will be deployed in Phase 2 (after Docker image is built)

module containerAppsEnvironment 'modules/container-apps-env.bicep' = {
  name: 'containerAppsEnvDeployment'
  params: {
    location: location
    environmentName: containerAppEnvName
    logAnalyticsWorkspaceId: deployMonitoring ? monitoring.outputs.logAnalyticsWorkspaceId : ''
  }
}

// ============================================================================
// Managed Identity for Container App
// ============================================================================
// Note: We create the identity now so RBAC roles can be assigned
// before Container App deployment

resource containerAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2025-01-31-preview' = {
  name: '${containerAppName}-identity'
  location: location
}

// ============================================================================
// Outputs - Critical for .env.production generation and Phase 2 deployment
// ============================================================================

@description('SQL Server FQDN')
output sqlServerFqdn string = sqlDatabase.outputs.sqlServerFqdn

@description('SQL Database name')
output sqlDatabaseName string = sqlDatabase.outputs.sqlDatabaseName

@description('SQL Server administrator username')
output sqlAdminUsername string = sqlAdminUsername

@description('Azure Container Registry login server')
output acrLoginServer string = containerRegistry.outputs.loginServer

@description('Azure Container Registry name')
output acrName string = containerRegistry.outputs.acrName

@description('Container App name (for Phase 2 deployment)')
output containerAppName string = containerAppName

@description('Container Apps Environment ID (for Phase 2 deployment)')
output containerAppEnvId string = containerAppsEnvironment.outputs.environmentId

@description('Container App managed identity principal ID (for RBAC)')
output containerAppPrincipalId string = containerAppIdentity.properties.principalId

@description('Container App managed identity resource ID (for Phase 2)')
output containerAppIdentityId string = containerAppIdentity.id

@description('Key Vault name')
output keyVaultName string = keyVault.outputs.keyVaultName

@description('Key Vault URI')
output keyVaultUri string = keyVault.outputs.keyVaultUri

@description('Storage Account connection string (if deployed)')
@secure()
output storageConnectionString string = deployStorage ? storageAccount.outputs.connectionString : ''

@description('Azure OpenAI endpoint (if deployed)')
output openAIEndpoint string = deployOpenAI ? openAI.outputs.endpoint : ''

@description('Azure OpenAI API key (if deployed)')
@secure()
output openAIApiKey string = deployOpenAI ? openAI.outputs.apiKey : ''

@description('Web PubSub connection string (if deployed)')
@secure()
output webPubSubConnectionString string = deployWebPubSub ? webPubSub.outputs.connectionString : ''

@description('Application Insights connection string (if deployed)')
output appInsightsConnectionString string = deployMonitoring ? monitoring.outputs.appInsightsConnectionString : ''


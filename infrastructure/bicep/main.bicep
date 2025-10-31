// ============================================================================
// Main Bicep Template - Azure Infrastructure Deployment
// ============================================================================
//
// Purpose:
//   Deploy complete Azure infrastructure for Next.js application with:
//   - Azure SQL Database (Basic tier for cost-efficiency)
//   - Azure Container Registry (for Docker images)
//   - Azure Container Apps (serverless containers)
//   - Azure Key Vault (secrets management with RBAC)
//   - Optional: Storage Account, OpenAI, Web PubSub, Application Insights
//
// Usage:
//   az deployment group create \
//     --resource-group <rg-name> \
//     --template-file main.bicep \
//     --parameters prefix=<prefix> location=<location>
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

@description('Container image tag')
param containerImageTag string = 'latest'

// ============================================================================
// Variables
// ============================================================================

// Naming convention: {prefix}-{resource-type}-{suffix}
var sqlServerName = '${prefix}-sql-${uniqueString(resourceGroup().id)}'
var sqlDatabaseName = '${prefix}-db'
var acrName = '${prefix}acr${uniqueString(resourceGroup().id)}'
var keyVaultName = '${prefix}-kv-${uniqueString(resourceGroup().id)}'
var containerAppEnvName = '${prefix}-env-${uniqueString(resourceGroup().id)}'
var containerAppName = '${prefix}-app'
var storageAccountName = '${prefix}st${uniqueString(resourceGroup().id)}'
var openAIAccountName = '${prefix}-openai-${uniqueString(resourceGroup().id)}'
var webPubSubName = '${prefix}-pubsub-${uniqueString(resourceGroup().id)}'
var logAnalyticsName = '${prefix}-logs-${uniqueString(resourceGroup().id)}'
var appInsightsName = '${prefix}-insights-${uniqueString(resourceGroup().id)}'

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

module containerAppsEnvironment 'modules/container-apps-env.bicep' = {
  name: 'containerAppsEnvDeployment'
  params: {
    location: location
    environmentName: containerAppEnvName
    logAnalyticsWorkspaceId: deployMonitoring ? monitoring.outputs.logAnalyticsWorkspaceId : ''
  }
}

// ============================================================================
// Module: Container App
// ============================================================================

module containerApp 'modules/container-app.bicep' = {
  name: 'containerAppDeployment'
  params: {
    location: location
    containerAppName: containerAppName
    containerAppEnvId: containerAppsEnvironment.outputs.environmentId
    acrLoginServer: containerRegistry.outputs.loginServer
    containerImageTag: containerImageTag
    appInsightsConnectionString: deployMonitoring ? monitoring.outputs.appInsightsConnectionString : ''
  }
}

// ============================================================================
// Role Assignments - REMOVED
// ============================================================================
//
// Note: Role assignments have been moved to a separate script
// (scripts/deploy/01b_assign_roles.sh) to avoid permission issues.
//
// Why?
// - Role assignments require Owner or User Access Administrator permissions
// - Most developers only have Contributor role
// - Separating role assignments allows infrastructure deployment to succeed
//
// Role assignments will be created by: scripts/deploy/01b_assign_roles.sh
// - Container App identity -> AcrPull on ACR
// - Container App identity -> Key Vault Secrets User on Key Vault

// ============================================================================
// Outputs - Critical for .env.production generation
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

@description('Container App name')
output containerAppName string = containerApp.outputs.containerAppName

@description('Container App FQDN')
output containerAppFqdn string = containerApp.outputs.containerAppFqdn

@description('Container App URL')
output containerAppUrl string = 'https://${containerApp.outputs.containerAppFqdn}'

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

@description('Container App principal ID for role assignments')
output containerAppPrincipalId string = containerApp.outputs.containerAppPrincipalId


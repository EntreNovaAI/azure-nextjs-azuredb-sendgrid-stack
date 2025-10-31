// ============================================================================
// Container App Bicep Template - Phase 2 Deployment
// ============================================================================
//
// Purpose:
//   Deploy Container App after Docker image has been built and pushed to ACR
//   This is Phase 2 of the two-phase deployment strategy
//
// Prerequisites:
//   Phase 1 must be completed first:
//   ✓ Foundation infrastructure deployed (main-foundation.bicep)
//   ✓ RBAC roles assigned (managed identity has AcrPull permission)
//   ✓ Docker image built and pushed to ACR
//
// Usage:
//   az deployment group create \
//     --resource-group <rg-name> \
//     --template-file main-app.bicep \
//     --parameters prefix=<prefix> location=<location>
//

// ============================================================================
// Parameters
// ============================================================================

@description('Prefix for resource names (must match Phase 1 deployment)')
@minLength(3)
@maxLength(15)
param prefix string

@description('Azure region (must match Phase 1 deployment)')
param location string = resourceGroup().location

@description('Container image tag')
param containerImageTag string = 'latest'

@description('Deploy Application Insights monitoring (must match Phase 1)')
param deployMonitoring bool = true

// ============================================================================
// Variables
// ============================================================================
// Note: These must match Phase 1 naming convention exactly

var containerAppName = '${prefix}-app'
var containerAppEnvName = '${prefix}-env-${uniqueString(resourceGroup().id)}'
var acrName = '${prefix}acr${uniqueString(resourceGroup().id)}'
var appInsightsName = '${prefix}-insights-${uniqueString(resourceGroup().id)}'

// ============================================================================
// Existing Resources (from Phase 1)
// ============================================================================
// Reference resources that were created in Phase 1

// Reference Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerAppEnvName
}

// Reference Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: acrName
}

// Reference Container App Managed Identity
resource containerAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2025-01-31-preview' existing = {
  name: '${containerAppName}-identity'
}

// Reference Application Insights (if deployed)
resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = if (deployMonitoring) {
  name: appInsightsName
}

// ============================================================================
// Module: Container App
// ============================================================================
// Deploy the Container App now that the Docker image exists

module containerApp 'modules/container-app.bicep' = {
  name: 'containerAppDeployment'
  params: {
    location: location
    containerAppName: containerAppName
    containerAppEnvId: containerAppsEnvironment.id
    acrLoginServer: containerRegistry.properties.loginServer
    containerImageTag: containerImageTag
    appInsightsConnectionString: deployMonitoring ? appInsights.properties.ConnectionString : ''
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Container App name')
output containerAppName string = containerApp.outputs.containerAppName

@description('Container App FQDN')
output containerAppFqdn string = containerApp.outputs.containerAppFqdn

@description('Container App URL')
output containerAppUrl string = 'https://${containerApp.outputs.containerAppFqdn}'

@description('Container App principal ID')
output containerAppPrincipalId string = containerApp.outputs.containerAppPrincipalId

@description('Container App resource ID')
output containerAppId string = containerApp.outputs.containerAppId


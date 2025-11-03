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

@description('Container image tag')
param containerImageTag string = 'latest'

@description('Deploy Application Insights monitoring (must match Phase 1)')
param deployMonitoring bool = true

@description('ACR name (from Phase 1 - REQUIRED)')
@minLength(5)
@maxLength(50)
param acrName string

@description('Container App Environment resource ID (from Phase 1 - REQUIRED)')
@minLength(1)
param containerAppEnvId string

@description('Managed Identity resource ID (from Phase 1 - REQUIRED)')
@minLength(1)
param managedIdentityId string

@description('App Insights name (from Phase 1 - REQUIRED when deployMonitoring is true)')
param appInsightsName string = ''

// ============================================================================
// Variables
// ============================================================================
// Note: These must match Phase 1 naming convention exactly
// These parameters are REQUIRED and must be provided from Phase 1 deployment

var containerAppName = '${prefix}-app'

// Use the provided parameter values directly
// No fallback defaults - deployment will fail with resource not found error if these are incorrect
// The @minLength(1) decorator on acrName and containerAppEnvId enforces they must be provided
var resolvedAcrName = acrName
var resolvedAppInsightsName = appInsightsName

// ============================================================================
// Existing Resources (from Phase 1)
// ============================================================================
// Reference resources that were created in Phase 1

// Reference Container Registry - use its location to ensure consistency with Phase 1
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: resolvedAcrName
}

// Get location from existing ACR to ensure all resources are in the same region
var location = containerRegistry.location

// Note: Container App Managed Identity is created by the container-app module
// No need to reference it here as an existing resource

// Reference Application Insights (only if name is provided and monitoring is enabled)
resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = if (deployMonitoring && !empty(resolvedAppInsightsName)) {
  name: resolvedAppInsightsName
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
    containerAppEnvId: containerAppEnvId  // Pass the full resource ID directly from Phase 1
    managedIdentityId: managedIdentityId  // Pass the managed identity ID from Phase 1
    acrLoginServer: containerRegistry.properties.loginServer
    containerImageTag: containerImageTag
    // Only pass App Insights connection string if monitoring is enabled AND App Insights name is provided
    appInsightsConnectionString: (deployMonitoring && !empty(resolvedAppInsightsName)) ? appInsights.properties.ConnectionString : ''
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


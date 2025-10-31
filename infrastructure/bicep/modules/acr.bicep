// ============================================================================
// Azure Container Registry Module
// ============================================================================
//
// Purpose:
//   Deploy Azure Container Registry for storing Docker images
//   Basic SKU for cost-efficiency
//

@description('Azure region')
param location string

@description('Container Registry name (must be globally unique)')
param acrName string

// ============================================================================
// Resources
// ============================================================================

// Azure Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-11-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic' // Cost-effective option for MVP
  }
  properties: {
    adminUserEnabled: false // Use managed identity instead of admin user
    publicNetworkAccess: 'Enabled' // MVP: Allow public access
    zoneRedundancy: 'Disabled'
    dataEndpointEnabled: false
    networkRuleBypassOptions: 'AzureServices'
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Container Registry login server')
output loginServer string = containerRegistry.properties.loginServer

@description('Container Registry name')
output acrName string = containerRegistry.name

@description('Container Registry resource ID')
output acrId string = containerRegistry.id


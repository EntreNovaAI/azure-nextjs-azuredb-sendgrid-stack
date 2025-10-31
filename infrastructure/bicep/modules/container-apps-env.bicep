// ============================================================================
// Azure Container Apps Environment Module
// ============================================================================
//
// Purpose:
//   Deploy Container Apps Environment with optional Log Analytics integration
//

@description('Azure region')
param location string

@description('Container Apps Environment name')
param environmentName string

@description('Log Analytics Workspace ID (optional)')
param logAnalyticsWorkspaceId string = ''

// ============================================================================
// Resources
// ============================================================================

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: !empty(logAnalyticsWorkspaceId) ? {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsWorkspaceId, '2022-10-01').customerId
        sharedKey: listKeys(logAnalyticsWorkspaceId, '2022-10-01').primarySharedKey
      }
    } : null
    zoneRedundant: false // Cost-efficiency for MVP
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Container Apps Environment ID')
output environmentId string = containerAppsEnvironment.id

@description('Container Apps Environment name')
output environmentName string = containerAppsEnvironment.name


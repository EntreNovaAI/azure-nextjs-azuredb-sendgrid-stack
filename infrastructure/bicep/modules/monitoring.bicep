// ============================================================================
// Azure Monitoring Module
// ============================================================================
//
// Purpose:
//   Deploy Log Analytics Workspace and Application Insights
//   For application monitoring and logging
//

@description('Azure region')
param location string

@description('Log Analytics Workspace name')
param logAnalyticsName string

@description('Application Insights name')
param appInsightsName string

@description('Log Analytics retention in days')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

// ============================================================================
// Resources
// ============================================================================

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2025-07-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018' // Pay-as-you-go pricing
    }
    retentionInDays: retentionInDays
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02-preview' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Log Analytics Workspace ID')
output logAnalyticsWorkspaceId string = logAnalytics.id

@description('Log Analytics Workspace customer ID')
output logAnalyticsCustomerId string = logAnalytics.properties.customerId

@description('Application Insights ID')
output appInsightsId string = appInsights.id

@description('Application Insights instrumentation key')
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey

@description('Application Insights connection string')
output appInsightsConnectionString string = appInsights.properties.ConnectionString


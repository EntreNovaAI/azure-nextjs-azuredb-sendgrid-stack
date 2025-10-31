// ============================================================================
// Azure Web PubSub Module
// ============================================================================
//
// Purpose:
//   Deploy Azure Web PubSub Service for real-time messaging
//   Free tier for cost-efficiency
//

@description('Azure region')
param location string

@description('Web PubSub name')
param webPubSubName string

@description('Web PubSub SKU')
@allowed([
  'Free_F1'
  'Standard_S1'
])
param webPubSubSku string = 'Free_F1'

@description('Web PubSub capacity (units)')
@minValue(1)
@maxValue(100)
param capacity int = 1

// ============================================================================
// Resources
// ============================================================================

// Web PubSub Service
// Note: Azure Web PubSub uses the Microsoft.SignalRService namespace
// This is the correct resource type for Azure Web PubSub service
resource webPubSub 'Microsoft.SignalRService/webPubSub@2025-01-01-preview' = {
  name: webPubSubName
  location: location
  sku: {
    name: webPubSubSku
    capacity: capacity
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    tls: {
      clientCertEnabled: false
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Web PubSub hostname')
output hostname string = webPubSub.properties.hostName

@description('Web PubSub connection string')
@secure()
output connectionString string = webPubSub.listKeys().primaryConnectionString

@description('Web PubSub resource ID')
output webPubSubId string = webPubSub.id


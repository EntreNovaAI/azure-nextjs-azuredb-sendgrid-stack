// ============================================================================
// Azure Storage Account Module
// ============================================================================
//
// Purpose:
//   Deploy Azure Storage Account for blob storage
//   Standard LRS for cost-efficiency
//

@description('Azure region')
param location string

@description('Storage Account name (must be globally unique)')
param storageAccountName string

// ============================================================================
// Resources
// ============================================================================

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS' // Locally redundant storage for cost-efficiency
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false // Disable public blob access for security
    publicNetworkAccess: 'Enabled' // MVP: Allow public access
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2025-06-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Storage Account name')
output storageAccountName string = storageAccount.name

@description('Storage Account connection string')
@secure()
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

@description('Storage Account resource ID')
output storageAccountId string = storageAccount.id

@description('Blob endpoint')
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob


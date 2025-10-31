// ============================================================================
// Azure OpenAI Module
// ============================================================================
//
// Purpose:
//   Deploy Azure OpenAI Service with GPT model
//   Note: Requires OpenAI service to be enabled in subscription
//

@description('Azure region (must support OpenAI)')
param location string

@description('OpenAI Account name')
param openAIAccountName string

@description('OpenAI deployment model')
param modelName string = 'gpt-35-turbo'

@description('OpenAI deployment model version')
param modelVersion string = '0613'

@description('OpenAI deployment capacity (in thousands of tokens per minute)')
param deploymentCapacity int = 10

// ============================================================================
// Resources
// ============================================================================

// OpenAI Account
resource openAIAccount 'Microsoft.CognitiveServices/accounts@2025-10-01-preview' = {
  name: openAIAccountName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0' // Standard SKU
  }
  properties: {
    customSubDomainName: openAIAccountName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// OpenAI Deployment
resource openAIDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-10-01-preview' = {
  parent: openAIAccount
  name: modelName
  sku: {
    name: 'Standard'
    capacity: deploymentCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('OpenAI endpoint')
output endpoint string = openAIAccount.properties.endpoint

@description('OpenAI API key')
@secure()
output apiKey string = openAIAccount.listKeys().key1

@description('OpenAI deployment name')
output deploymentName string = openAIDeployment.name

@description('OpenAI resource ID')
output openAIId string = openAIAccount.id


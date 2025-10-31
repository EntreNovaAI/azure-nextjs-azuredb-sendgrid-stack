// ============================================================================
// Azure Key Vault Module
// ============================================================================
//
// Purpose:
//   Deploy Azure Key Vault for secrets management
//   Configured with RBAC (no access policies)
//

@description('Azure region')
param location string

@description('Key Vault name (must be globally unique)')
param keyVaultName string

// ============================================================================
// Resources
// ============================================================================

// Azure Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2025-05-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard' // Standard SKU for cost-efficiency
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true // Use RBAC instead of access policies
    enableSoftDelete: true
    softDeleteRetentionInDays: 7 // Minimum retention period
    enablePurgeProtection: true // Recommended for production
    publicNetworkAccess: 'Enabled' // MVP: Allow public access
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow' // MVP: Allow all; restrict in production
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Key Vault name')
output keyVaultName string = keyVault.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Key Vault resource ID')
output keyVaultId string = keyVault.id


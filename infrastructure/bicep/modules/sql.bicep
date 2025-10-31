// ============================================================================
// Azure SQL Database Module
// ============================================================================
//
// Purpose:
//   Deploy Azure SQL Server and Database with Basic tier for cost-efficiency
//   Configured for secure access with firewall rules
//

@description('Azure region')
param location string

@description('SQL Server name')
param sqlServerName string

@description('SQL Database name')
param sqlDatabaseName string

@description('SQL Server administrator username')
param administratorLogin string

@description('SQL Server administrator password')
@secure()
param administratorPassword string

@description('SQL Database SKU')
@allowed([
  'Basic'
  'S0'
  'S1'
  'S2'
  'S3'
])
param databaseSku string = 'Basic'

// ============================================================================
// Resources
// ============================================================================

// SQL Server
resource sqlServer 'Microsoft.Sql/servers@2024-11-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled' // MVP: Allow public access; use private endpoints in production
  }
}

// SQL Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2024-11-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: databaseSku
    tier: databaseSku == 'Basic' ? 'Basic' : 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2 GB
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false
    readScale: 'Disabled'
    requestedBackupStorageRedundancy: 'Local'
  }
}

// Firewall rule: Allow Azure services
resource firewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2024-11-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('SQL Server FQDN')
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName

@description('SQL Server name')
output sqlServerName string = sqlServer.name

@description('SQL Database name')
output sqlDatabaseName string = sqlDatabase.name

@description('SQL Server resource ID')
output sqlServerId string = sqlServer.id


// ============================================================================
// Azure Container App Module
// ============================================================================
//
// Purpose:
//   Deploy Container App with managed identity
//   Configured for minimal cost (0-1 replicas, minimal resources)
//

@description('Azure region')
param location string

@description('Container App name')
param containerAppName string

@description('Container Apps Environment ID')
param containerAppEnvId string

@description('ACR login server')
param acrLoginServer string

@description('Container image tag')
param containerImageTag string = 'latest'

@description('Application Insights connection string (optional)')
param appInsightsConnectionString string = ''

@description('Managed Identity resource ID (from Phase 1 - REQUIRED)')
param managedIdentityId string

// ============================================================================
// Resources
// ============================================================================

// Note: Managed Identity is created in Phase 1 (main-foundation.bicep)
// We reference the existing identity to get its properties
resource existingIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2025-01-31-preview' existing = {
  name: last(split(managedIdentityId, '/'))  // Extract name from resource ID
  scope: resourceGroup()  // Identity is in the same resource group
}

// Container App
resource containerApp 'Microsoft.App/containerApps@2025-07-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}  // Use identity from Phase 1
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnvId
    configuration: {
      activeRevisionsMode: 'Single' // Single revision mode for simplicity and cost efficiency
      ingress: {
        external: true // Public access - required for web application
        targetPort: 3000
        transport: 'auto' // Automatically handles HTTP/1 and HTTP/2
        allowInsecure: false // HTTPS only - enforces TLS encryption for all traffic
        // Note: Azure Container Apps automatically provides TLS 1.2+ 
        // with managed certificates at no additional cost
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
        // Optional: IP restrictions for additional security layer
        // Note: IP restrictions are disabled by default for public web access
        // To enable: set enableIpRestrictions = true and provide allowedIpRanges
        // This feature requires Container Apps API version with IP restrictions support
      }
      registries: [
        {
          server: acrLoginServer
          identity: managedIdentityId // Use managed identity from Phase 1 for ACR authentication (no passwords needed)
        }
      ]
      secrets: [] // Secrets will be added later via bind_secrets script
      // Security: Secrets are referenced from Azure Key Vault, not stored in Container App
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: '${acrLoginServer}/${containerAppName}:${containerImageTag}'
          resources: {
            // Cost optimization: Using minimum allowed resources
            // 0.25 vCPU + 0.5 GiB = ~$13/month at full utilization (730 hours)
            // With scale-to-zero, costs only incur during active usage
            cpu: json('0.25') // Minimal CPU (0.25 vCPU minimum per container)
            memory: '0.5Gi' // Minimal memory (0.5 GiB minimum per container)
          }
          probes: [
            {
              // Liveness probe: Restarts container if app becomes unresponsive
              // Prevents stuck containers from continuing to run
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 3000
                scheme: 'HTTP' // Internal probe uses HTTP (external traffic still uses HTTPS)
              }
              initialDelaySeconds: 15 // Wait 15s after container start before first probe
              periodSeconds: 30 // Check every 30 seconds
              timeoutSeconds: 5 // Probe timeout
              failureThreshold: 3 // Restart after 3 consecutive failures
            }
            {
              // Readiness probe: Controls when container receives traffic
              // Prevents traffic to containers that aren't ready to serve requests
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 3000
                scheme: 'HTTP' // Internal probe uses HTTP (external traffic still uses HTTPS)
              }
              initialDelaySeconds: 10 // Check readiness sooner than liveness
              periodSeconds: 10 // Check more frequently for faster traffic routing
              timeoutSeconds: 3 // Shorter timeout for readiness
              failureThreshold: 3 // Remove from load balancer after 3 failures
            }
          ]
          env: !empty(appInsightsConnectionString) ? [
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsightsConnectionString
            }
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
          ] : [
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
          ]
        }
      ]
      scale: {
        // Cost optimization: Scale-to-zero configuration
        // When no traffic, container stops and costs = $0
        // Cold start on first request takes ~5-10 seconds
        minReplicas: 0 // Scale to zero when idle (maximum cost savings)
        maxReplicas: 1 // Single replica limit (suitable for MVP/low traffic)
        // Note: For production with high traffic, consider minReplicas: 1, maxReplicas: 5+
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                // Scale up when concurrent requests exceed 10
                // With maxReplicas: 1, this mainly controls scale-down timing
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('Container App name')
output containerAppName string = containerApp.name

@description('Container App FQDN')
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn

@description('Container App principal ID (from Phase 1)')
output containerAppPrincipalId string = existingIdentity.properties.principalId

@description('Container App identity ID (from Phase 1)')
output containerAppIdentityId string = existingIdentity.id

@description('Container App resource ID')
output containerAppId string = containerApp.id


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

// ============================================================================
// Resources
// ============================================================================

// Managed Identity for Container App
resource containerAppIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2025-01-31-preview' = {
  name: '${containerAppName}-identity'
  location: location
}

// Container App
resource containerApp 'Microsoft.App/containerApps@2025-07-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${containerAppIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnvId
    configuration: {
      activeRevisionsMode: 'Single' // Single revision mode for simplicity
      ingress: {
        external: true // Public access
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false // HTTPS only
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: acrLoginServer
          identity: containerAppIdentity.id // Use managed identity for ACR
        }
      ]
      secrets: [] // Secrets will be added later via az_bind_secrets.sh
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: '${acrLoginServer}/${containerAppName}:${containerImageTag}'
          resources: {
            cpu: json('0.25') // Minimal CPU for cost-efficiency
            memory: '0.5Gi' // Minimal memory
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              timeoutSeconds: 3
              failureThreshold: 3
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
        minReplicas: 0 // Scale to zero for cost savings
        maxReplicas: 1 // Single replica for MVP
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
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

@description('Container App principal ID')
output containerAppPrincipalId string = containerAppIdentity.properties.principalId

@description('Container App identity ID')
output containerAppIdentityId string = containerAppIdentity.id

@description('Container App resource ID')
output containerAppId string = containerApp.id


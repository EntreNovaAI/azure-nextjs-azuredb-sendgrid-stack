import { WebPubSubServiceClient } from "@azure/web-pubsub"

/**
 * Get Azure Web PubSub client
 * 
 * IMPORTANT: Lazy initialization prevents build-time errors
 * In production (Azure Container Apps), secrets are injected at runtime from Key Vault
 * During Docker build, these env vars won't exist yet, so we validate at runtime
 */
export function webPubSubClient(hub = "app") {
  // Validate at runtime (not at module import time)
  const conn = process.env.AZURE_WEB_PUBSUB_CONNECTION_STRING
  
  if (!conn) {
    throw new Error('Missing required environment variable: AZURE_WEB_PUBSUB_CONNECTION_STRING')
  }
  
  return new WebPubSubServiceClient(conn, hub)
}

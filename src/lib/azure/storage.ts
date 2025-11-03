import { BlobServiceClient } from "@azure/storage-blob"

/**
 * Get Azure Blob Storage client
 * 
 * IMPORTANT: Lazy initialization prevents build-time errors
 * In production (Azure Container Apps), secrets are injected at runtime from Key Vault
 * During Docker build, these env vars won't exist yet, so we validate at runtime
 */
export function getBlobClient() {
  // Validate at runtime (not at module import time)
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING
  const container = process.env.AZURE_STORAGE_CONTAINER
  
  if (!conn) {
    throw new Error('Missing required environment variable: AZURE_STORAGE_CONNECTION_STRING')
  }
  if (!container) {
    throw new Error('Missing required environment variable: AZURE_STORAGE_CONTAINER')
  }
  
  const service = BlobServiceClient.fromConnectionString(conn)
  return service.getContainerClient(container)
}

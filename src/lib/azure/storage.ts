import { BlobServiceClient } from "@azure/storage-blob"

export function getBlobClient() {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING!
  const container = process.env.AZURE_STORAGE_CONTAINER!
  const service = BlobServiceClient.fromConnectionString(conn)
  return service.getContainerClient(container)
}

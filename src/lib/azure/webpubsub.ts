import { WebPubSubServiceClient } from "@azure/web-pubsub"

export function webPubSubClient(hub = "app") {
  const conn = process.env.AZURE_WEB_PUBSUB_CONNECTION_STRING!
  return new WebPubSubServiceClient(conn, hub)
}

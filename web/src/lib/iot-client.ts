"use client"

import type { IotEvent } from "./iot"

/** terma-iot backend (Go, repo Raya46/terma-iot): laptop in local demos, the VPS in production. */
export const IOT_URL = process.env.NEXT_PUBLIC_TERMA_IOT_URL ?? "http://localhost:8080"

/** Live device events. Replays events after `after`, then pushes new ones; EventSource reconnects by itself. */
export function subscribeIot(after: number, onEvent: (event: IotEvent) => void, onStatus?: (online: boolean) => void) {
  const source = new EventSource(`${IOT_URL}/api/iot/stream?after=${after}`)
  // SAFETY: payloads come from terma-iot, which validates every device post before stamping and storing it.
  source.onmessage = message => onEvent(JSON.parse(message.data) as IotEvent)
  source.onopen = () => onStatus?.(true)
  source.onerror = () => onStatus?.(false)
  return () => source.close()
}

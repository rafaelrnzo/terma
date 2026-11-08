"use client"

import type { IotEvent } from "./iot"

/** Live device events through this web server (signed-in users only; Band values only for Klinik). */
export function subscribeIot(after: number, onEvent: (event: IotEvent) => void, onStatus?: (online: boolean) => void) {
  const source = new EventSource(`/api/iot/stream?after=${after}`)
  // SAFETY: payloads come from terma-iot, which validates every device post before stamping and storing it.
  source.onmessage = message => onEvent(JSON.parse(message.data) as IotEvent)
  source.onopen = () => onStatus?.(true)
  source.onerror = () => onStatus?.(false)
  return () => source.close()
}

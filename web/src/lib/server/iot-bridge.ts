import type { IotEvent } from "../iot"
import { applySystemAction } from "./workspace-store"

/** terma-iot base URL as seen from this server, and the key that lets it read the stream. */
export const iotUrl = () => process.env.TERMA_IOT_URL ?? "http://localhost:3028"
export const iotKey = () => process.env.TERMA_IOT_KEY ?? ""

/** Reads `data:` lines of an SSE body and hands each parsed event to `onEvent`. */
export async function readEvents(body: ReadableStream<Uint8Array>, onEvent: (event: IotEvent) => void, onComment?: (comment: string) => void) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) if (line.startsWith(":")) {
      onComment?.(line.trimEnd())
    } else if (line.startsWith("data: ")) {
      // SAFETY: terma-iot validates and stamps every event before it reaches its stream.
      try { onEvent(JSON.parse(line.slice(6)) as IotEvent) } catch { /* a malformed line is skipped, the stream continues */ }
    }
  }
}

/**
 * Keeps one subscription from this server to terma-iot and files device events into the shared
 * workspace, so readings land even when no browser is open. Ingestion is idempotent, so replaying
 * from the start after a restart is safe.
 */
export function ensureIotBridge() {
  const holder = globalThis as { __termaIotBridge?: true }
  if (holder.__termaIotBridge || !iotKey()) return
  holder.__termaIotBridge = true
  let after = 0
  const connect = async () => {
    for (;;) {
      try {
        const response = await fetch(`${iotUrl()}/api/iot/stream?after=${after}`, { headers: { "x-terma-key": iotKey() } })
        if (response.ok && response.body) await readEvents(response.body, event => {
          after = Math.max(after, event.seq)
          applySystemAction({ type: "TERIMA_IOT", events: [event] })
        })
      } catch { /* terma-iot offline: retry below */ }
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  void connect()
}

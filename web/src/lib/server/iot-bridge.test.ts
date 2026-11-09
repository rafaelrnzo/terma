import { describe, expect, it } from "vitest"
import type { IotEvent } from "../iot"
import { readEvents } from "./iot-bridge"

describe("IoT stream forwarding", () => {
  it("forwards heartbeats before any reading, including split network chunks", async () => {
    const encoder = new TextEncoder()
    let upstream!: ReadableStreamDefaultController<Uint8Array>
    const body = new ReadableStream<Uint8Array>({ start(controller) { upstream = controller } })
    const comments: string[] = []
    const events: IotEvent[] = []
    let receivedPing!: () => void
    const ping = new Promise<void>(resolve => { receivedPing = resolve })
    const reading = readEvents(body, event => events.push(event), comment => {
      comments.push(comment)
      receivedPing()
    })

    upstream.enqueue(encoder.encode(": pi"))
    upstream.enqueue(encoder.encode("ng\r\n\r\n"))
    try {
      await ping
      expect(comments).toEqual([": ping"])
      expect(events).toEqual([])
    } finally {
      upstream.close()
      await reading
    }
  }, 1000)

  it("preserves device events alongside heartbeats", async () => {
    const event: IotEvent = { type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 1000, seq: 1, receivedAt: "2026-11-09T19:00:00.000Z" }
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`: ping\n\ndata: ${JSON.stringify(event)}\n\n`))
        controller.close()
      },
    })
    const events: IotEvent[] = []
    await readEvents(body, event => events.push(event))
    expect(events).toEqual([event])
  })
})

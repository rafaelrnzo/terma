import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const actor = vi.hoisted(() => ({ role: "ADMIN" }))
vi.mock("@/lib/server/auth", () => ({ userFromRequest: () => actor }))
vi.mock("@/lib/server/iot-bridge", async () => ({
  iotKey: () => "test-key",
  iotUrl: () => "http://iot.test",
  readEvents: (await import("../../../../lib/server/iot-bridge")).readEvents,
}))

import { GET } from "./route"

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => { actor.role = "ADMIN" })

describe("IoT event stream", () => {
  it.each(["ADMIN", "KLINIK", "HSE", "MANDOR"])("keeps device identity and applies Band value permissions for %s", async role => {
    actor.role = role
    const band = { type: "band", deviceId: "BAND-01", seq: 1, receivedAt: "2026-11-09T19:00:00.000Z", heartRate: 80, skinC: 34, spo2: 98, battery: null }
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`data: ${JSON.stringify(band)}\n\n`, { status: 200 })))
    const response = await GET(new Request("http://web.test/api/iot/stream"))
    const frames = (await response.text()).split("\n").filter(line => line.startsWith("data: "))
    const expected = role === "ADMIN" || role === "KLINIK" ? band : { ...band, heartRate: null, skinC: null, spo2: null }
    expect(frames).toEqual([`data: ${JSON.stringify(expected)}`])
  })

  it("opens immediately even when the device server has no readings", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream(), { status: 200 })))
    const response = await GET(new Request("http://web.test/api/iot/stream?after=0"))
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("text/event-stream")
    expect(response.headers.get("cache-control")).toContain("no-transform")
    const reader = response.body!.getReader()
    const first = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("stream did not open")), 300)),
    ])
    expect(new TextDecoder().decode(first.value)).toBe(": connected\n\n")
    void reader.cancel()
  })
})

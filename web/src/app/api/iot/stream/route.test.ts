import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/auth", () => ({ userFromRequest: () => ({ role: "ADMIN" }) }))
vi.mock("@/lib/server/iot-bridge", () => ({
  iotKey: () => "test-key",
  iotUrl: () => "http://iot.test",
  readEvents: () => new Promise<void>(() => {}),
}))

import { GET } from "./route"

afterEach(() => vi.unstubAllGlobals())

describe("IoT event stream", () => {
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

import { afterEach, describe, expect, it, vi } from "vitest"
import { awalInterval, hariIni } from "./config"

afterEach(() => vi.useRealTimers())

describe("Jakarta operational time", () => {
  it("changes the shift date at midnight WIB, including on a UTC server", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-09T16:59:59.000Z"))
    expect(hariIni()).toBe("2026-11-09")
    vi.setSystemTime(new Date("2026-11-09T17:00:00.000Z"))
    expect(hariIni()).toBe("2026-11-10")
  })

  it("matches Station timestamps and freshness checks to WIB intervals", () => {
    expect(new Date(awalInterval("2026-11-06", 10)).toISOString()).toBe("2026-11-06T03:00:00.000Z")
    expect(new Date(awalInterval("2026-11-06", 24)).toISOString()).toBe("2026-11-06T17:00:00.000Z")
  })
})

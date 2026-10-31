import { describe, expect, it } from "vitest"
import { initialDemoState } from "./store"
import { USERS } from "./config"
import { overviewZones } from "./overview"
import { heatSeries } from "./heat-series"

describe("chart source quality", () => {
  it("preserves a missing interval instead of replacing it with zero", () => {
    const state = initialDemoState("2026-10-31")
    state.bacaan = state.bacaan.filter(reading => reading.zonaKode !== "COR_B" || reading.jamMulai !== 10)
    const zone = overviewZones(state, USERS[0], 12).find(item => item.kode === "COR_B")!
    const points = heatSeries(zone, state.tanggal)
    expect(points).toHaveLength(8)
    expect(points[2].value).toBeNull()
    expect(points[1].value).toBe(28.4)
  })
  it("keeps forecast-only zones empty", () => {
    const state = initialDemoState("2026-10-31")
    const zone = overviewZones(state, USERS[0], 12).find(item => item.kode === "BEK_A")!
    expect(heatSeries(zone, state.tanggal).every(point => point.value === null)).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import { overviewZones } from "./overview"
import { USERS } from "./config"
import { reducer, stateAwal } from "./store"

const seeded = () => reducer(stateAwal("2026-10-25"), { type: "MUAT_DEMO" })

describe("overview zone data", () => {
  it("keeps replay and missing measurements distinct", () => {
    const zones = overviewZones(seeded(), USERS[0], 8)
    expect(zones[0].kualitas).toBe("REPLAY")
    expect(zones[0].valid).toBe(8)
    expect(zones[1].kualitas).toBe("PRAKIRAAN_SAJA")
    expect(zones[1].reading).toBeUndefined()
    expect(zones[1].valid).toBe(0)
    expect(zones[1].series.every((p) => !p.reading)).toBe(true)
  })

  it("does not reuse readings from another date", () => {
    const zones = overviewZones({ ...seeded(), tanggal: "2026-10-26" }, USERS[0], 8)
    expect(zones.every((z) => z.kualitas === "TIDAK_TERSEDIA" && z.valid === 0)).toBe(true)
    expect(zones.every((z) => z.series.every((p) => !p.reading))).toBe(true)
  })

  it("restricts worker counts to the user's crew", () => {
    const state = seeded()
    const hse = overviewZones(state, USERS[0], 8)
    const budi = overviewZones(state, USERS[1], 8)
    const sari = overviewZones(state, USERS[2], 8)
    expect(hse.reduce((sum, z) => sum + z.workers, 0)).toBe(8)
    expect(budi.reduce((sum, z) => sum + z.workers, 0)).toBe(state.pekerja.filter((p) => p.reguKode === "COR").length)
    expect(sari.reduce((sum, z) => sum + z.workers, 0)).toBe(state.pekerja.filter((p) => p.reguKode === "BEK").length)
  })
})

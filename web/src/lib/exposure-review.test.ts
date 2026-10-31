import { describe, expect, it } from "vitest"
import { initialDemoState } from "./store"
import { USERS } from "./config"
import { monthlyExposure } from "./exposure-review"

describe("monthly verified exposure", () => {
  it("does not count planned or unverified reported minutes", () => {
    const state = initialDemoState("2026-10-31")
    state.tindakan = state.tindakan.map(action => ({ ...action, status: "TINDAKAN_DILAPORKAN", menitDilaporkan: 480 }))
    expect(monthlyExposure(state, USERS[0]).every(row => row.verifiedMinutes === 0 && row.verifiedShifts === 0)).toBe(true)
  })
  it("excludes other months and keeps foreman results within their crew", () => {
    const state = initialDemoState("2026-10-31")
    const current = monthlyExposure(state, USERS[0])
    expect(current.some(row => row.verifiedMinutes > 0)).toBe(true)
    expect(monthlyExposure(state, USERS[1]).every(row => row.worker.reguKode === "COR")).toBe(true)
    state.tanggal = "2026-11-01"
    expect(monthlyExposure(state, USERS[0]).every(row => row.verifiedMinutes === 0)).toBe(true)
  })
  it("counts a replacement verification once per worker per day", () => {
    const state = initialDemoState("2026-10-31")
    const action = state.tindakan.find(item => item.status === "TERVERIFIKASI")!
    state.tindakan.push({ ...action, id: "replacement", menitDiverifikasi: 42, waktuVerifikasi: "2026-10-31T23:59:00Z" })
    const row = monthlyExposure(state, USERS[0]).find(item => item.worker.kode === action.pekerjaKode)
    expect(row?.verifiedMinutes).toBe(42)
    expect(row?.verifiedShifts).toBe(1)
  })
})

import { describe, expect, it } from "vitest"
import { USERS } from "./config"
import { rayaDemoWorkspace } from "./raya-demo"
import { waterVisits } from "./water-visits"

describe("named drinking visits", () => {
  it("keeps each visit, newest first, and filters by date, worker and foreman scope", () => {
    const date = "2026-11-10"
    const state = rayaDemoWorkspace(date)
    const management = state.management!
    management.workers.push({ ...management.workers[0], kode: "OTHER", nama: "Other worker", reguKode: "BEK" })
    const visit = { id: "tap-1", type: "WATER_VISIT" as const, pekerjaKode: "RAYA001", deviceId: "TWS-01", observedAt: `${date}T09:00:00+07:00`, origin: "AKTUAL" as const, attribution: "DEMO_RAYA" as const }
    management.shifts[0].personalTelemetry = [visit, { ...visit, id: "tap-2", observedAt: `${date}T09:01:00+07:00` }, { ...visit, id: "other", pekerjaKode: "OTHER", observedAt: `${date}T09:02:00+07:00` }, visit]
    const admin = USERS.find(user => user.role === "ADMIN")!
    expect(waterVisits(state, admin, date).map(row => row.id)).toEqual(["other", "tap-2", "tap-1"])
    expect(waterVisits(state, admin, date, "RAYA001").map(row => row.name)).toEqual(["Raya", "Raya"])
    expect(waterVisits(state, USERS.find(user => user.id === "mandor-budi")!, date).map(row => row.code)).toEqual(["RAYA001", "RAYA001"])
    expect(waterVisits(state, admin, "2026-11-09")).toEqual([])
  })
})

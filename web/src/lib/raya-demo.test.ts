import { describe, expect, it } from "vitest"
import { USERS } from "./config"
import { pageAllowedFor } from "./navigation"
import { rayaDemoWorkspace } from "./raya-demo"
import { reducer } from "./store-reducer"
import { readDemoState } from "./workspace-document"

describe("Raya demo seed", () => {
  it("creates one worker and one usable shift", () => {
    const date = "2026-11-10"
    const state = readDemoState(JSON.stringify(rayaDemoWorkspace(date)))
    expect(state.pekerja.map(worker => worker.kode)).toEqual(["RAYA001"])
    expect(state.management?.workers.map(worker => worker.nama)).toEqual(["Raya"])
    expect(state.management?.shifts.map(shift => shift.id)).toEqual([date])
    expect(state.management?.shifts[0].readiness?.checkins).toEqual([])
    const raya = USERS.find(user => user.username === "raya")!
    expect(raya.pekerjaKode).toBe("RAYA001")
    expect(pageAllowedFor(raya, "/kiosk")).toBe(true)
    expect(pageAllowedFor(raya, "/impor")).toBe(false)
    const signedIn = reducer(state, { type: "LOGIN", userId: raya.id })
    const checkedIn = reducer(signedIn, { type: "CATAT_CHECKIN", pekerjaKode: raya.pekerjaKode!, kondisi: "BAIK", keluhan: [], metode: "TAP_KARTU", persetujuan: true })
    expect(checkedIn.management?.shifts[0].readiness?.checkins[0]).toMatchObject({ pekerjaKode: "RAYA001", metode: "TAP_KARTU" })
  })
})

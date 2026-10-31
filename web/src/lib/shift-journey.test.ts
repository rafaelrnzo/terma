import { describe, expect, it } from "vitest"
import { USERS } from "./config"
import { initialDemoState, stateAwal, isiPesan } from "./store"
import { guideRoutes, guideItinerary, shiftJourney } from "./shift-journey"

const [hse, budi, sari, dataOfficer] = USERS

function oneWorker() {
  const state = initialDemoState("2026-10-31")
  state.pekerja = state.pekerja.filter(worker => worker.kode === "DEMO001")
  const currentId = `COR:${isiPesan(state, "COR").rencanaIds.join("+")}`
  state.pengiriman = state.pengiriman.filter(delivery => delivery.reguKode === "COR").map(delivery => ({ ...delivery, id: currentId }))
  return state
}

describe("role-aware shift handoff", () => {
  it("starts HSE with missing data while a foreman waits for instructions", () => {
    const state = stateAwal("2026-10-31")
    expect(shiftJourney(state, hse).focus).toMatchObject({ href: "/impor", state: "action" })
    expect(shiftJourney(state, budi).focus).toMatchObject({ href: "/instruksi", state: "waiting", owner: "HSE" })
  })
  it("shows the seeded incomplete adaptation instead of a generic next page", () => {
    const state = initialDemoState("2026-10-31")
    state.tindakan = state.tindakan.filter(action => action.status !== "TINDAKAN_DILAPORKAN")
    expect(shiftJourney(state, hse).focus).toMatchObject({ href: "/paparan", state: "action" })
  })
  it("counts pending reports only in the assigned crew and current plan date", () => {
    const state = oneWorker()
    state.tindakan = state.tindakan.map(action => action.pekerjaKode === "DEMO001" ? { ...action, status: "DIAKUI" } : action)
    expect(shiftJourney(state, budi).focus).toMatchObject({ href: "/tindakan", state: "action", owner: "MANDOR" })
    expect(shiftJourney(state, sari).focus.state).toBe("waiting")
    state.tanggal = "2026-11-01"
    expect(shiftJourney(state, budi).focus).toMatchObject({ href: "/instruksi", state: "waiting" })
  })
  it("routes a reported action to HSE verification and makes the foreman wait", () => {
    const state = oneWorker()
    state.tindakan = state.tindakan.map(action => action.pekerjaKode === "DEMO001" ? { ...action, status: "TINDAKAN_DILAPORKAN" } : action)
    expect(shiftJourney(state, hse).focus).toMatchObject({ href: "/tindakan", state: "action", owner: "HSE", stage: 4 })
    expect(shiftJourney(state, budi).focus).toMatchObject({ state: "waiting", owner: "HSE" })
  })
  it("requires current-version sharing, ignoring failed and historical deliveries", () => {
    const state = oneWorker()
    state.pengiriman = state.pengiriman.map(delivery => ({ ...delivery, status: "GAGAL" }))
    expect(shiftJourney(state, hse).focus).toMatchObject({ href: "/instruksi", state: "action", owner: "HSE" })
    state.pengiriman = state.pengiriman.map(delivery => ({ ...delivery, id: "COR:old-version", status: "DIBAGIKAN_MANUAL" }))
    expect(shiftJourney(state, hse).focus.state).toBe("action")
  })
  it("does not count a returned unfinished report as completed", () => {
    const state = oneWorker()
    state.tindakan = state.tindakan.map(action => action.pekerjaKode === "DEMO001" ? { ...action, status: "BELUM_SELESAI" } : action)
    expect(shiftJourney(state, hse).focus).toMatchObject({ state: "waiting", owner: "MANDOR" })
    expect(shiftJourney(state, budi).focus).toMatchObject({ state: "action", href: "/tindakan" })
  })
  it("shows closure only after verified current actions for the scope", () => {
    const state = oneWorker()
    expect(shiftJourney(state, hse).focus).toMatchObject({ href: "/laporan", state: "complete" })
    expect(shiftJourney(state, budi).focus.state).toBe("complete")
  })
  it("includes a real worker review in the HSE walkthrough without changing records", () => {
    const state = initialDemoState("2026-10-31")
    const before = JSON.stringify(state)
    const routes = guideItinerary(state, hse)
    expect(routes[3]).toBe("/rencana")
    expect(routes[4]).toBe("/pekerja/DEMO002")
    expect(guideItinerary(state, budi)).toEqual(["/instruksi", "/tindakan"])
    expect(JSON.stringify(state)).toBe(before)
  })
  it("gives the data officer only data-entry tour routes", () => {
    expect(guideRoutes(dataOfficer.role)).toEqual(["/impor", "/pengukuran", "/ringkasan"])
    expect(guideRoutes(budi.role)).toEqual(["/instruksi", "/tindakan"])
    expect(guideRoutes(hse.role)).toContain("/rencana")
  })
})

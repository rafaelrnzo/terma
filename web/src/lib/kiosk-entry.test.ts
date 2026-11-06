import { describe, expect, it } from "vitest"
import { cameraErrorMessage, isCheckinMethod } from "./kiosk-entry"
import { emptyWorkspaceState, readDemoState, reducer } from "./store"
import { currentShift } from "./management-state"

function draft() {
  let state = reducer(emptyWorkspaceState("2026-11-06"), { type: "SINKRON_PERUSAHAAN" })
  state = reducer(state, { type: "BUAT_SHIFT", tanggal: "2026-11-06", nama: "Shift kios", workerCodes: ["CMP001"] })
  return state
}

describe("camera and card attendance provenance", () => {
  it("persists each entry method without duplicating worker attendance", () => {
    for (const metode of ["KAMERA", "PRATINJAU_KAMERA", "TAP_KARTU"] satisfies ("KAMERA" | "PRATINJAU_KAMERA" | "TAP_KARTU")[]) {
      let state = reducer(draft(), { type: "CATAT_CHECKIN", pekerjaKode: "CMP001", kondisi: "BAIK", keluhan: [], metode })
      state = reducer(state, { type: "CATAT_CHECKIN", pekerjaKode: "CMP001", kondisi: "BAIK", keluhan: [], metode })
      const restored = readDemoState(JSON.stringify(state))
      expect(currentShift(restored)?.readiness?.checkins).toHaveLength(1)
      expect(currentShift(restored)?.readiness?.checkins[0].metode).toBe(metode)
      expect(restored.kehadiran).toHaveLength(1)
    }
  })
  it("accepts older entries without a method and rejects untrusted method values", () => {
    const state = reducer(draft(), { type: "CATAT_CHECKIN", pekerjaKode: "CMP001", kondisi: "BAIK", keluhan: [] })
    expect(() => readDemoState(JSON.stringify(state))).not.toThrow()
    const withMethod = reducer(draft(), { type: "CATAT_CHECKIN", pekerjaKode: "CMP001", kondisi: "BAIK", keluhan: [], metode: "KAMERA" })
    expect(() => readDemoState(JSON.stringify(withMethod).replace('"metode":"KAMERA"', '"metode":"UNKNOWN"'))).toThrow("Invalid shift readiness")
    expect(isCheckinMethod("FACE_RECOGNIZED" )).toBe(false)
  })
  it("gives actionable camera recovery for denied, absent and busy devices", () => {
    expect(cameraErrorMessage(new DOMException("denied", "NotAllowedError"))).toContain("Izin kamera")
    expect(cameraErrorMessage(new DOMException("missing", "NotFoundError"))).toContain("tidak ditemukan")
    expect(cameraErrorMessage(new DOMException("busy", "NotReadableError"))).toContain("aplikasi lain")
  })
})

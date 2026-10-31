import { describe, expect, it } from "vitest"
import { telemetryFrame, stationReadings } from "./device-telemetry"
import { emptyWorkspaceState, reducer, type Action } from "./store"

const date = "2026-10-31"
function draft() {
  const actions: Action[] = [
    { type: "SIMPAN_PEKERJA", input: { kode: "PK01", nama: "Adi", reguKode: "COR", tanggalMulai: date, tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } },
    { type: "BUAT_SHIFT", tanggal: date, nama: "Shift pagi", workerCodes: ["PK01"] },
  ]
  return actions.reduce(reducer, emptyWorkspaceState(date))
}

describe("local telemetry adapter", () => {
  it("drives readouts, visits and packet counts from one deterministic frame", () => {
    expect(telemetryFrame(24, "COR_B", 12)).toEqual(telemetryFrame(24, "COR_B", 12))
    const before = telemetryFrame(24, "COR_B", 12)
    const after = telemetryFrame(24, "COR_B", 12, 1)
    expect(after.visits).toBe(before.visits + 1)
    expect(after.packets).toBe(before.packets + 1)
    expect(after.wbgt).toBeGreaterThan(telemetryFrame(24, "GUDANG", 12).wbgt)
  })
  it("generates 24 unique zone/interval readings with retained recorded provenance", () => {
    const rows = stationReadings(date)
    expect(rows).toHaveLength(24)
    expect(new Set(rows.map(row => `${row.zonaKode}:${row.jamMulai}`)).size).toBe(24)
    expect(rows.every(row => row.origin === "REPLAY" && row.tanggal === date && row.idAlat.startsWith("TST-"))).toBe(true)
  })
  it("fills gaps idempotently and never replaces manual observations", () => {
    let state = reducer(draft(), { type: "INPUT_BACAAN", zonaKode: "GUDANG", jamMulai: 8, isbb: 25, idAlat: "MANUAL01", kalibrasi: "Cert-01" })
    state = reducer(state, { type: "AMBIL_BACAAN_PERANGKAT" })
    expect(state.bacaan).toHaveLength(24)
    expect(state.bacaan.find(row => row.zonaKode === "GUDANG" && row.jamMulai === 8)?.idAlat).toBe("MANUAL01")
    expect(reducer(state, { type: "AMBIL_BACAAN_PERANGKAT" }).bacaan).toEqual(state.bacaan)
    expect(state.management?.shifts[0].workspace.bacaan).toEqual(state.bacaan)
  })
  it("requires an open shift, write permission, and an unclosed snapshot", () => {
    expect(reducer(emptyWorkspaceState(date), { type: "AMBIL_BACAAN_PERANGKAT" }).bacaan).toHaveLength(0)
    const foreman = reducer(draft(), { type: "LOGIN", userId: "mandor-budi" })
    expect(reducer(foreman, { type: "AMBIL_BACAAN_PERANGKAT" }).bacaan).toHaveLength(0)
    const state = draft()
    const closed = { ...state, management: { ...state.management!, shifts: state.management!.shifts.map(shift => ({ ...shift, status: "CLOSED" as const })) } }
    expect(reducer(closed, { type: "AMBIL_BACAAN_PERANGKAT" }).notice?.tipe).toBe("error")
    expect(reducer(closed, { type: "AMBIL_BACAAN_PERANGKAT" }).bacaan).toHaveLength(0)
  })
  it("never auto-approves plans when new device readings trigger recomputation", () => {
    let state = reducer(draft(), { type: "HITUNG_RENCANA" })
    state = reducer(state, { type: "SETUJUI", rencanaId: state.rencana[0].id })
    state = reducer(state, { type: "AMBIL_BACAAN_PERANGKAT" })
    const current = state.rencana.filter(plan => !plan.digantikan)
    expect(current.every(plan => !plan.disetujuiOleh)).toBe(true)
    expect(state.rencana.some(plan => plan.digantikan && plan.disetujuiOleh)).toBe(true)
  })
})

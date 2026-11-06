import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer } from "./store"
import { managementOf } from "./management-state"

describe("company data connector", () => {
  it("provides linked reference masters and health summaries once without recording attendance", () => {
    const state = reducer(emptyWorkspaceState("2026-11-06"), { type: "SINKRON_PERUSAHAAN" })
    const company = managementOf(state)
    expect(company.workers).toHaveLength(8)
    expect(company.workers.every(worker => worker.origin === "SINTETIS")).toBe(true)
    expect(company.healthBaselines).toHaveLength(8)
    expect(company.assignments).toHaveLength(8)
    expect(company.shifts).toHaveLength(0)
    expect(state.kehadiran).toHaveLength(0)
    expect(managementOf(reducer(state, { type: "SINKRON_PERUSAHAAN" })).workers).toEqual(company.workers)
  })
  it("preserves existing workers and health data rather than replacing them with references", () => {
    const state = reducer(emptyWorkspaceState("2026-11-06"), { type: "SIMPAN_PEKERJA", input: { kode: "CUSTOM01", nama: "Pekerja tersimpan", reguKode: "COR", tanggalMulai: "2026-10-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
    const synced = reducer(state, { type: "SINKRON_PERUSAHAAN" })
    expect(managementOf(synced).workers).toEqual(managementOf(state).workers)
    expect(managementOf(synced).companySync?.source).toBe("WORKSPACE")
  })
})

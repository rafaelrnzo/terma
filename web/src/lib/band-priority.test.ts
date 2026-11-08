import { describe, expect, it } from "vitest"
import { bandPriority, releaseSuggested, suggestedAllocations } from "./band-priority"
import { emptyWorkspaceState, reducer } from "./store"
import { managementOf } from "./management-state"
import type { Action, AppState } from "./store-state"
import type { RiskColour } from "./types"

const date = "2026-11-06"
const run = (s: AppState, ...a: Action[]) => a.reduce(reducer, s)
const worker = (kode: string): Action => ({ type: "SIMPAN_PEKERJA", input: { kode, nama: kode, reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
const colour = (s: AppState, code: string, riskColour: RiskColour, personalScore = 0): AppState => ({ ...s, rencana: s.rencana.map(plan => plan.pekerjaKode === code ? { ...plan, riskColour, personalScore } : plan) })

function shift(codes: string[]) {
  let s = run(emptyWorkspaceState(date), ...codes.map(worker), { type: "BUAT_SHIFT", tanggal: date, nama: "Shift", workerCodes: codes }, { type: "LOGIN", userId: "klinik-dewi" })
  for (const code of codes) s = reducer(s, { type: "PERSETUJUAN_MEDIS", pekerjaKode: code, jenis: "BAND", aktif: true })
  return reducer(s, { type: "LOGIN", userId: "hse-ratna" })
}

describe("morning Band allocation", () => {
  it("ranks red before yellow before green, then by personal score, and fills free units top down", () => {
    let s = shift(["G1", "R1", "Y1", "Y2"])
    s = colour(colour(colour(colour(s, "G1", "HIJAU"), "R1", "MERAH"), "Y1", "KUNING", 2), "Y2", "KUNING", 4)
    expect(bandPriority(s).map(row => row.kode)).toEqual(["R1", "Y2", "Y1", "G1"])
    expect(suggestedAllocations(s)).toEqual([{ bandId: "BAND-01", pekerjaKode: "R1" }, { bandId: "BAND-02", pekerjaKode: "Y2" }])
    s = reducer(s, { type: "ATUR_BAND", bandId: "BAND-01", pekerjaKode: "R1" })
    expect(suggestedAllocations(s)).toEqual([{ bandId: "BAND-02", pekerjaKode: "Y2" }])
  })

  it("suggests release only after three green shifts with acclimatisation done", () => {
    const s = shift(["W1"])
    expect(releaseSuggested(s, "W1")).toBe(false)
    const m = managementOf(s)
    const base = m.shifts[0]
    const past = ["2026-11-03", "2026-11-04", "2026-11-05"].map(tanggal => ({ ...base, id: tanggal, tanggal, status: "CLOSED" as const, workspace: { ...base.workspace, rencana: base.workspace.rencana.map(plan => ({ ...plan, riskColour: "HIJAU" as RiskColour })) } }))
    expect(releaseSuggested({ ...s, management: { ...m, shifts: [...past, base] } }, "W1")).toBe(true)
    past[2] = { ...past[2], workspace: { ...past[2].workspace, rencana: past[2].workspace.rencana.map(plan => ({ ...plan, riskColour: "KUNING" as RiskColour })) } }
    expect(releaseSuggested({ ...s, management: { ...m, shifts: [...past, base] } }, "W1")).toBe(false)
  })
})

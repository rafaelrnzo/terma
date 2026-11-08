import { describe, expect, it } from "vitest"
import { heatWave, hotterZoneMove } from "./acclimatisation-triggers"
import { managementOf } from "./management-state"
import { emptyWorkspaceState, reducer, rencanaAktif } from "./store"
import type { Action, AppState } from "./store-state"
import type { PengukuranWBGT } from "./types"

const today = "2026-11-10"
const run = (s: AppState, ...a: Action[]) => a.reduce(reducer, s)
const reading = (tanggal: string, zonaKode: string, isbb: number): PengukuranWBGT => ({ zonaKode, tanggal, jamMulai: 12, isbb, idAlat: "QUEST", pencatat: "Tono", kalibrasi: "C-1", origin: "MANUAL", waktuCatat: `${tanggal}T12:00:00+07:00` })

/** Today's shift with W01 in `zone`, plus three earlier shifts (W01 in GUDANG) carrying the given readings. */
function withHistory(zone: string, past: (date: string) => PengukuranWBGT[]) {
  let s = run(emptyWorkspaceState(today), { type: "SIMPAN_PEKERJA", input: { kode: "W01", nama: "W01", reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: zone, apd: "Standar" } }, { type: "BUAT_SHIFT", tanggal: today, nama: "Hari ini", workerCodes: ["W01"] })
  const m = managementOf(s)
  const base = m.shifts[0]
  const earlier = ["2026-11-07", "2026-11-08", "2026-11-09"].map(tanggal => ({ ...base, id: tanggal, tanggal, status: "CLOSED" as const, workspace: { ...base.workspace, bacaan: past(tanggal), penugasan: base.workspace.penugasan.map(row => ({ ...row, zonaKode: "GUDANG" })) } }))
  // History exists before today's plan in real use: drop the plan computed without it.
  s = { ...s, rencana: [], management: { ...m, shifts: [...earlier, base] } }
  return run(s, { type: "LOGIN", userId: "hse-ratna" })
}
const plan = (s: AppState) => rencanaAktif(s).find(row => row.pekerjaKode === "W01")!

describe("acclimatisation re-triggers", () => {
  it("cuts the first day of a heat wave by 50% when today's maximum is 2 °C above the 7-day mean", () => {
    let s = run(withHistory("GUDANG", date => [reading(date, "GUDANG", 28)]), { type: "KONFIRMASI", pekerjaKode: "W01", profil: "NORMAL", hari: 1 })
    expect(heatWave(s, 29)).toBeNull()
    expect(heatWave(s, 30.5)).toEqual({ delta: 2.5, firstDay: true })
    s = reducer(s, { type: "INPUT_BACAAN", zonaKode: "GUDANG", jamMulai: 9, isbb: 30.5, idAlat: "QUEST", kalibrasi: "C-1" })
    expect(plan(s).batasHarianMenit).toBe(240)
    expect(plan(s).alasan.join(" ")).toContain("Gelombang panas hari pertama")
  })

  it("asks HSE to restart acclimatisation after a move to a zone at least 2 °C hotter", () => {
    let s = withHistory("COR_B", date => [reading(date, "GUDANG", 26), reading(date, "COR_B", 28.5)])
    expect(hotterZoneMove(s, "W01", "COR_B")).toEqual({ from: "GUDANG", delta: 2.5 })
    expect(hotterZoneMove(s, "W01", "GUDANG")).toBeNull()
    s = reducer(s, { type: "INPUT_BACAAN", zonaKode: "COR_B", jamMulai: 9, isbb: 27, idAlat: "QUEST", kalibrasi: "C-1" })
    expect(plan(s).alasan.join(" ")).toContain("Pindah dari GUDANG")
    expect(plan(s).totalKerjaMenit).toBe(0) // waits for HSE confirmation
  })

  it("keeps acclimatisation points after day 7 until three green shifts, up to day 14", () => {
    let s = withHistory("GUDANG", date => [reading(date, "GUDANG", 26)])
    s = run(s, { type: "KONFIRMASI", pekerjaKode: "W01", profil: "PEKERJA_BARU", hari: 9 })
    expect(plan(s).alasan.join(" ")).toContain("Perpanjangan aklimatisasi hari 9")
  })
})

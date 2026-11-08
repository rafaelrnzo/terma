import { describe, expect, it } from "vitest"
import { JAM_SHIFT, TUGAS } from "./config"
import { DOSE_RULES, dailyDose, kidneyReferrals, overtimeMinutes } from "./heat-dose"
import { currentShift, managementOf } from "./management-state"
import { emptyWorkspaceState, reducer, rencanaAktif } from "./store"
import type { ShiftRecord } from "./management-types"
import type { Action, AppState } from "./store-state"

const today = "2026-11-06"
const run = (s: AppState, ...a: Action[]) => a.reduce(reducer, s)
const worker = (kode: string): Action => ({ type: "SIMPAN_PEKERJA", input: { kode, nama: kode, reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
const weight = DOSE_RULES.weight[TUGAS.find(task => task.kode === "PEMERIKSAAN")!.beban]

/** Today's shift with ISBB 31 °C every hour in GUDANG (manual readings) and confirmed normal profiles. */
function shift(codes: string[]) {
  let s = run(emptyWorkspaceState(today), ...codes.map(worker), { type: "BUAT_SHIFT", tanggal: today, nama: "Hari ini", workerCodes: codes }, { type: "LOGIN", userId: "hse-ratna" })
  for (const code of codes) s = reducer(s, { type: "KONFIRMASI", pekerjaKode: code, profil: "NORMAL", hari: 1 })
  for (const hour of JAM_SHIFT) s = reducer(s, { type: "INPUT_BACAAN", zonaKode: "GUDANG", jamMulai: hour, isbb: 31, idAlat: "QUEST", kalibrasi: "C-1" })
  return s
}
/** Copy of today's shift on another date, with each worker present from 08.00 until `until[code]`. */
function presence(s: AppState, date: string, until: Record<string, string>): ShiftRecord {
  const base = currentShift(s)!
  // ISBB′ fixed at 31 °C in every hour of the plan, so the dose formula is checked on its own.
  const rencana = rencanaAktif(s).map(plan => ({ ...plan, intervals: plan.intervals.map(row => ({ ...row, isbb: 31 })) }))
  return { ...base, id: date, tanggal: date, status: "CLOSED", workspace: { ...base.workspace, rencana }, readiness: { baselines: [], reviews: [], checkins: Object.entries(until).map(([pekerjaKode, end]) => ({ pekerjaKode, kondisi: "BAIK" as const, keluhan: [], persetujuan: true, waktu: `${date}T08:00:00+07:00`, pulang: `${date}T${end}:00+07:00` })) } }
}

describe("check-out, daily dose and overtime", () => {
  it("records check-out once, after check-in", () => {
    let s = shift(["W01"])
    expect(reducer(s, { type: "CATAT_PULANG", pekerjaKode: "W01" }).notice?.tipe).toBe("error")
    s = run(s, { type: "CATAT_CHECKIN", pekerjaKode: "W01", kondisi: "BAIK", keluhan: [], persetujuan: true }, { type: "CATAT_PULANG", pekerjaKode: "W01" })
    expect(currentShift(s)?.readiness?.checkins[0].pulang).toBeTruthy()
    expect(reducer(s, { type: "CATAT_PULANG", pekerjaKode: "W01" }).notice?.tipe).toBe("info")
  })

  it("sums (ISBB′ − 25) × workload weight over hours on site and counts overtime past 17.00", () => {
    const s = shift(["W01"])
    const day = presence(s, "2026-11-05", { W01: "12:00" })
    expect(dailyDose(day, "W01")).toMatchObject({ dose: 4 * (31 - 25) * weight, hoursOnSite: 4, missingHours: 0 })
    expect(overtimeMinutes(presence(s, "2026-11-05", { W01: "17:45" }), "W01")).toBe(45)
  })

  it("adds +1 after overtime on the last three shifts", () => {
    let s = shift(["W01"])
    const m = managementOf(s)
    s = { ...s, rencana: [], management: { ...m, shifts: [...["2026-11-03", "2026-11-04", "2026-11-05"].map(date => presence(s, date, { W01: "18:00" })), ...m.shifts] } }
    s = reducer(s, { type: "INPUT_BACAAN", zonaKode: "GUDANG", jamMulai: 8, isbb: 30, idAlat: "QUEST", kalibrasi: "C-1" })
    expect(rencanaAktif(s).find(plan => plan.pekerjaKode === "W01")!.alasan.join(" ")).toContain("Lembur 3 shift berturut-turut (+1)")
  })
})

describe("kidney screening referrals", () => {
  it("refers D90 ≥ site P75 with a kidney risk factor, watches closely without one, and needs 30 days of data", () => {
    let s = shift(["WA", "WB", "WC"])
    s = run(s, { type: "LOGIN", userId: "klinik-dewi" }, { type: "PERSETUJUAN_MEDIS", pekerjaKode: "WA", jenis: "MCU", aktif: true },
      { type: "SIMPAN_PROFIL_MEDIS", input: { pekerjaKode: "WA", hipertensi: true, diabetes: false, jantung: false, riwayatPanas: false, obatBerisiko: false, catatan: "" } })
    const m = managementOf(s)
    const days = Array.from({ length: 30 }, (_, i) => new Date(Date.parse("2026-10-07T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10))
    const history = { ...s, management: { ...m, shifts: [...days.map(date => presence(s, date, { WA: "16:00", WB: "16:00", WC: "10:00" })), ...m.shifts] } }
    const { p75, rows } = kidneyReferrals(history)
    expect(p75).toBeGreaterThan(0)
    expect(Object.fromEntries(rows.map(row => [row.worker.kode, row.status]))).toEqual({ WA: "RUJUK", WB: "PANTAU_KETAT", WC: "PANTAU" })
    expect(kidneyReferrals({ ...history, management: { ...m, shifts: [...days.slice(0, 10).map(date => presence(s, date, { WA: "16:00" })), ...m.shifts] } }).p75).toBeNull()
  })
})

import { describe, expect, it } from "vitest"
import { USERS } from "./config"
import type { ManagementState, ShiftRecord } from "./management-types"
import { stateAwal } from "./store-state"
import { workspaceSnapshot } from "./management-state"
import { baselineValidity, workerHealthHistory, workerHealthRows } from "./worker-health"
import type { HealthBaseline, WorkerCheckin, ReadinessReview } from "./worker-readiness"

const date = "2026-11-06"
const hse = USERS.find(user => user.role === "HSE")!
const data = USERS.find(user => user.role === "PETUGAS_DATA")!
const foreman = USERS.find(user => user.id === "mandor-budi")!
const workers = [
  { kode: "W01", nama: "Adi", reguKode: "COR", tanggalMulai: date, source: "Manual", origin: "MANUAL" as const },
  { kode: "W02", nama: "Bima", reguKode: "BEK", tanggalMulai: date, source: "Manual", origin: "MANUAL" as const },
]
const baseline: HealthBaseline = { pekerjaKode: "W01", tanggalPemeriksaan: "2026-10-01", berlakuSampai: date, status: "DENGAN_PEMBATASAN", pembatasan: "Pembatasan dari pemeriksa", sumber: "MCU-001", dicatatOleh: "HSE", dicatatPada: `${date}T06:00:00Z` }
const checkin: WorkerCheckin = { pekerjaKode: "W01", kondisi: "ADA_KELUHAN", keluhan: ["Pusing"], waktu: `${date}T00:00:00Z` }
const review: ReadinessReview = { pekerjaKode: "W01", hasil: "LANJUT_TINJAU_RENCANA", catatan: "Arahan kerja dicatat HSE", oleh: "HSE", waktu: `${date}T01:00:00Z` }
function fixture(): ManagementState {
  const shift: ShiftRecord = { id: date, nama: "Shift pagi", tanggal: date, status: "DRAFT", dibuatOleh: "HSE", dibuatPada: `${date}T00:00:00Z`, workspace: { ...workspaceSnapshot(stateAwal(date)), pekerja: [workers[0]] }, readiness: { baselines: [baseline], checkins: [checkin], reviews: [] } }
  return { workers, assignments: [], shifts: [shift], activeId: null, healthBaselines: [baseline] }
}

describe("worker health directory projection", () => {
  it("keeps missing, future and expired documents distinct and includes the final valid date", () => {
    expect(baselineValidity(undefined, date)).toBe("BELUM_ADA")
    expect(baselineValidity(baseline, "2026-09-30")).toBe("BELUM_BERLAKU")
    expect(baselineValidity(baseline, date)).toBe("BERLAKU")
    expect(baselineValidity(baseline, "2026-11-07")).toBe("KEDALUWARSA")
  })
  it("does not carry another day's condition or review into the requested date", () => {
    const row = workerHealthRows(fixture(), hse, "2026-11-05")[0]
    expect(row.checkedIn).toBe(false)
    expect(row.health?.checkin).toBeUndefined()
    expect(row.status).toBe("PERLU_TINJAU")
  })
  it("prioritizes deferral and requires valid evidence even with a saved review", () => {
    const management = fixture()
    expect(workerHealthRows(management, hse, date)[0].status).toBe("PERLU_TINJAU")
    management.shifts[0].readiness!.reviews = [review]
    expect(workerHealthRows(management, hse, date)[0].status).toBe("PERLU_TINJAU")
    expect(workerHealthRows(management, hse, date)[0].health?.checkin).toBeUndefined()
    expect(workerHealthRows(management, hse, date)[0].health?.review).toBeUndefined()
    management.shifts[0].readiness!.baselines = []
    expect(workerHealthRows(management, hse, date)[0].status).toBe("DATA_KURANG")
    management.shifts[0].readiness!.reviews = [{ ...review, hasil: "TUNDA_PENUGASAN" }]
    expect(workerHealthRows(management, hse, date)[0].status).toBe("DITUNDA")
  })
  it("uses the requested shift snapshot even when the master or active shift differs", () => {
    const management = fixture()
    management.healthBaselines = [{ ...baseline, status: "TANPA_PEMBATASAN", berlakuSampai: "2027-11-06", pembatasan: "" }]
    const row = workerHealthRows(management, hse, date)[0]
    expect(row.health?.baseline).toEqual(baseline)
    expect(row.shift?.id).toBe(date)
    management.shifts[0].readiness = undefined
    expect(workerHealthRows(management, hse, date)[0].health?.baseline).toBeUndefined()
  })
  it("redacts health details for data officers and scopes foremen to their crew", () => {
    const management = fixture()
    expect(workerHealthRows(management, data, date).every(row => row.health === undefined)).toBe(true)
    const scoped = workerHealthRows(management, foreman, date)
    expect(scoped.map(row => row.worker.kode)).toEqual(["W01"])
    expect(JSON.stringify(scoped)).not.toContain("Pusing")
    expect(JSON.stringify(workerHealthRows(management, data, date))).not.toContain("MCU-001")
    expect(workerHealthHistory(management, data, "W01")).toEqual([])
    expect(workerHealthHistory(management, foreman, "W01")).toEqual([])
  })
  it("returns dated history in reverse order without mutating snapshots", () => {
    const management = fixture()
    management.shifts.push({ ...management.shifts[0], id: "older", tanggal: "2026-11-01", status: "CLOSED" })
    const original = JSON.stringify(management)
    expect(workerHealthHistory(management, hse, "W01").map(row => row.id)).toEqual([date, "older"])
    expect(workerHealthHistory(management, hse, "unknown")).toEqual([])
    expect(JSON.stringify(management)).toBe(original)
  })
})

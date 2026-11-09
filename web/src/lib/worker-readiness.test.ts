import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, readDemoState, type AppState, type Action } from "./store"
import { currentShift, managementOf, ensureManagement } from "./management-state"
import { readinessProgress, type BaselineInput } from "./worker-readiness"

const date = "2026-10-31"
const baseline: BaselineInput = { pekerjaKode: "W01", tanggalPemeriksaan: "2026-10-01", berlakuSampai: "2027-10-01", status: "DENGAN_PEMBATASAN", pembatasan: "Ikuti pembatasan kerja dari pemeriksa perusahaan", sumber: "Ringkasan pemeriksaan perusahaan MCU-001" }
const checkin = { type: "CATAT_CHECKIN", persetujuan: true, pekerjaKode: "W01", kondisi: "ADA_KELUHAN", keluhan: ["Pusing"] } satisfies Action
const review = { type: "TINJAU_KONDISI", pekerjaKode: "W01", hasil: "LANJUT_TINJAU_RENCANA", catatan: "Keluhan diklarifikasi dan tindak lanjut dicatat sesuai SOP" } satisfies Action
const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state)
function master() { return reducer(emptyWorkspaceState(date), { type: "SIMPAN_PEKERJA", input: { kode: "W01", nama: "Adi", reguKode: "COR", tanggalMulai: date, tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } }) }
function draft() { return run(master(), { type: "SIMPAN_BASELINE", input: baseline }, { type: "BUAT_SHIFT", tanggal: date, nama: "Shift pagi", workerCodes: ["W01"] }) }

describe("attendance, company baseline and HSE review", () => {
  it("does not infer actual attendance from participant selection", () => {
    const state = draft()
    expect(state.kehadiran).toHaveLength(0)
    expect(readinessProgress(state).ready).toBe(false)
    expect(currentShift(state)?.readiness?.baselines[0]).toMatchObject(baseline)
  })
  it("records attendance and self-reported symptoms once and survives reload", () => {
    const state = run(draft(), checkin)
    const repeated = reducer(state, checkin)
    expect(repeated.kehadiran).toHaveLength(1)
    expect(currentShift(repeated)?.readiness?.checkins).toHaveLength(1)
    expect(readDemoState(JSON.stringify(repeated))).toEqual({ ...repeated, notice: undefined })
    expect(readinessProgress(repeated)).toMatchObject({ checked: 1, reviewed: 0, ready: false })
  })
  it("resets departure separately from arrival and keeps an audit trail", () => {
    const checked = run(draft(), checkin, review, { type: "CATAT_PULANG", pekerjaKode: "W01" })
    const departure = reducer(checked, { type: "RESET_ABSEN_PULANG", pekerjaKode: "W01" })
    expect(currentShift(departure)?.readiness?.checkins[0]?.pulang).toBeUndefined()
    expect(departure.kehadiran).toHaveLength(1)
    expect(currentShift(departure)?.readiness?.reviews).toHaveLength(1)
    expect(departure.audit[0]?.aksi).toBe("RESET_ABSEN_PULANG")

    const arrival = reducer(departure, { type: "RESET_ABSEN_MASUK", pekerjaKode: "W01" })
    expect(currentShift(arrival)?.readiness?.checkins).toEqual([])
    expect(currentShift(arrival)?.readiness?.reviews).toEqual([])
    expect(currentShift(arrival)?.workspace.kehadiran).toEqual([])
    expect(arrival.kehadiran).toEqual([])
    expect(arrival.audit[0]?.aksi).toBe("RESET_ABSEN_MASUK")
    expect(readDemoState(JSON.stringify(arrival)).management?.shifts[0].readiness?.checkins).toEqual([])
    expect(reducer(arrival, checkin).management?.shifts[0].readiness?.checkins).toHaveLength(1)
  })
  it("limits attendance reset to HSE, admin, and the worker's own server session", () => {
    const checked = run(draft(), checkin, { type: "CATAT_PULANG", pekerjaKode: "W01" })
    const dataOfficer = run(checked, { type: "LOGIN", userId: "data-tono" })
    expect(reducer(dataOfficer, { type: "RESET_ABSEN_PULANG", pekerjaKode: "W01" }).notice?.tipe).toBe("error")
    const shift = currentShift(checked)!
    const closed = { ...checked, management: { ...checked.management!, shifts: [{ ...shift, status: "CLOSED" as const }] } }
    expect(reducer(closed, { type: "RESET_ABSEN_MASUK", pekerjaKode: "W01" }).notice?.tipe).toBe("error")
    expect(currentShift(closed)?.readiness?.checkins[0]?.pulang).toBeTruthy()
  })
  it("rejects unknown workers, missing symptoms, and inconsistent good-condition answers", () => {
    for (const action of [{ ...checkin, pekerjaKode: "missing" }, { ...checkin, keluhan: [] }, { ...checkin, kondisi: "BAIK" as const }]) {
      const state = reducer(draft(), action)
      expect(state.notice?.tipe).toBe("error")
      expect(state.kehadiran).toHaveLength(0)
    }
  })
  it("requires check-in before HSE review and denies other roles", () => {
    expect(reducer(draft(), review).notice?.tipe).toBe("error")
    for (const userId of ["data-tono", "mandor-budi"]) {
      const state = run(draft(), checkin, { type: "LOGIN", userId })
      expect(reducer(state, review).notice?.tipe).toBe("error")
      expect(reducer(state, { type: "SIMPAN_BASELINE", input: baseline }).notice?.tipe).toBe("error")
    }
  })
  it("keeps a deferred worker blocked and resets review on corrected answers", () => {
    const state = run(draft(), checkin, { ...review, hasil: "TUNDA_PENUGASAN" })
    expect(readinessProgress(state).ready).toBe(false)
    expect(reducer(state, { type: "TERBITKAN_SHIFT", shiftId: date }).notice?.tipe).toBe("error")
    const ready = reducer(state, review)
    expect(readinessProgress(ready).ready).toBe(true)
    const changed = reducer(ready, { ...checkin, kondisi: "BAIK", keluhan: [] })
    expect(readinessProgress(changed).ready).toBe(false)
  })
  it("requires review again when a draft receives a changed company baseline", () => {
    const state = run(draft(), checkin, review)
    const changed = reducer(state, { type: "SIMPAN_BASELINE", input: { ...baseline, pembatasan: "Pembatasan kerja baru dari pemeriksa" } })
    expect(readinessProgress(changed).reviewed).toBe(0)
    expect(managementOf(changed).healthBaselines?.[0].pembatasan).toContain("baru")
  })
  it("preserves closed and approved snapshots when the master baseline changes", () => {
    const state = run(draft(), checkin, review)
    const shift = currentShift(state)
    if (!shift || !state.management) throw new Error("Expected draft")
    const closed: AppState = { ...state, management: { ...state.management, shifts: [{ ...shift, status: "CLOSED" }] } }
    const changed = reducer(closed, { type: "SIMPAN_BASELINE", input: { ...baseline, pembatasan: "Pembatasan untuk shift berikutnya" } })
    expect(currentShift(changed)?.readiness).toEqual(shift.readiness)
    expect(reducer(changed, checkin).notice?.tipe).toBe("error")
  })
  it("does not carry company health data into a reused deleted worker ID", () => {
    const state = run(master(), { type: "SIMPAN_BASELINE", input: baseline }, { type: "HAPUS_PEKERJA", kode: "W01", expectedRevision: 1 })
    expect(managementOf(state).workers).toHaveLength(0)
    expect(managementOf(state).healthBaselines).toHaveLength(0)
  })
  it("retains reviews when the same baseline is saved again", () => {
    const state = run(draft(), checkin, review)
    expect(readinessProgress(reducer(state, { type: "SIMPAN_BASELINE", input: baseline })).ready).toBe(true)
  })
  it("adds check-in to untouched older drafts without rewriting completed history", () => {
    const state = draft()
    const shift = currentShift(state)
    if (!shift || !state.management) throw new Error("Expected draft")
    const legacy = { ...state, management: { ...state.management, shifts: [{ ...shift, readiness: undefined }] } }
    expect(currentShift(ensureManagement(legacy))?.readiness?.checkins).toEqual([])
    const closed: AppState = { ...legacy, management: { ...legacy.management, shifts: [{ ...shift, status: "CLOSED", readiness: undefined }] } }
    expect(ensureManagement(closed)).toEqual(closed)
  })
  it("rejects malformed saved screening while preserving compatibility with older shifts", () => {
    const state = draft()
    const raw = JSON.stringify(state).replace('"checkins":[]', '"checkins":null')
    expect(() => readDemoState(raw)).toThrow("Invalid shift readiness")
    const shift = currentShift(state)
    if (!shift || !state.management) throw new Error("Expected draft")
    const legacy = { ...state, management: { ...state.management, shifts: [{ ...shift, readiness: undefined }] } }
    expect(() => readDemoState(JSON.stringify(legacy))).not.toThrow()
    expect(readinessProgress(legacy).required).toBe(false)
  })
})

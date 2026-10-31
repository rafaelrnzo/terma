import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, readDemoState, reducer, rencanaAktif, type AppState, type Action } from "./store"
import { currentShift, managementOf, ensureManagement } from "./management-state"
import { monthlyExposure } from "./exposure-review"
import { USERS } from "./config"
import { initialDemoState } from "./store"
import type { WorkerInput } from "./management-types"

const date = "2026-10-31"
const worker: WorkerInput = { kode: "PK01", nama: "Adi", reguKode: "COR", tanggalMulai: date, tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" }
const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state)
const add = { type: "SIMPAN_PEKERJA", input: worker } satisfies Action
const create = { type: "BUAT_SHIFT", tanggal: date, nama: "Shift pagi", workerCodes: [worker.kode] } satisfies Action
function draft() { return run(emptyWorkspaceState(date), add, create) }
function approved() {
  let state = run(draft(), { type: "KONFIRMASI", pekerjaKode: worker.kode, profil: "PEKERJA_BARU", hari: 1 })
  const csv = "zona,tanggal,jam_mulai,isbb,id_alat,pencatat,kalibrasi,asal,waktu_catat\n" + Array.from({ length: 8 }, (_, i) => `GUDANG,${date},${i + 8},26,WBGT01,HSE,2026-10-01,REPLAY,${date}T${String(i + 8).padStart(2, "0")}:00:00+07:00`).join("\n")
  state = run(state, { type: "IMPOR_PENGUKURAN", csv, source: "readings.csv" }, { type: "HITUNG_RENCANA" })
  for (const plan of rencanaAktif(state)) state = reducer(state, { type: "SETUJUI", rencanaId: plan.id })
  return state
}
function reported() {
  let state = run(approved(), { type: "TERBITKAN_SHIFT", shiftId: date }, { type: "BAGIKAN", reguKode: "COR", kanal: "manual" }, { type: "LOGIN", userId: "mandor-budi" })
  state = reducer(state, { type: "AKUI", pengirimanId: state.pengiriman[0].id })
  for (const action of state.tindakan) state = reducer(state, { type: "LAPOR", tindakanId: action.id, dijalankan: true, pelaksana: "Budi", waktu: "15:30", menit: 90 })
  return reducer(state, { type: "LOGIN", userId: "hse-ratna" })
}
function verified() {
  let state = reported()
  for (const action of state.tindakan) state = reducer(state, { type: "VERIFIKASI", tindakanId: action.id, hasil: "TERVERIFIKASI", menit: 85 })
  return state
}

describe("worker master CRUD", () => {
  it("starts empty and creates master data without silently creating a shift", () => {
    const state = run(emptyWorkspaceState(date), add)
    expect(state.pekerja).toHaveLength(0)
    expect(managementOf(state).workers[0].origin).toBe("MANUAL")
    expect(currentShift(state)).toBeUndefined()
  })
  it("rejects duplicate IDs, invalid fields, stale revisions, and ID changes", () => {
    const state = run(emptyWorkspaceState(date), add)
    const invalidActions: Action[] = [add, { ...add, input: { ...worker, reguKode: "unknown" } }, { ...add, previousCode: "PK01", expectedRevision: 9 }, { ...add, input: { ...worker, kode: "PK02" }, previousCode: "PK01", expectedRevision: 1 }]
    for (const action of invalidActions) {
      const next = reducer(state, action)
      expect(next.notice?.tipe).toBe("error")
      expect(managementOf(next).workers).toEqual(managementOf(state).workers)
    }
  })
  it("edits and deletes unused workers, checking the last revision", () => {
    let state = run(emptyWorkspaceState(date), add, { type: "SIMPAN_PEKERJA", input: { ...worker, nama: "Adi baru" }, previousCode: worker.kode, expectedRevision: 1 })
    expect(managementOf(state).workers[0].revision).toBe(2)
    state = reducer(state, { type: "HAPUS_PEKERJA", kode: worker.kode, expectedRevision: 1 })
    expect(state.notice?.tipe).toBe("error")
    state = reducer(state, { type: "HAPUS_PEKERJA", kode: worker.kode, expectedRevision: 2 })
    expect(managementOf(state).workers).toHaveLength(0)
    expect(managementOf(state).assignments).toHaveLength(0)
  })
  it("archives referenced workers and preserves shift identity after master changes", () => {
    let state = run(draft(), { type: "SIMPAN_PEKERJA", input: { ...worker, nama: "Nama baru", zonaKode: "COR_B" }, previousCode: worker.kode, expectedRevision: 1 })
    expect(state.pekerja[0].nama).toBe("Adi")
    expect(state.penugasan[0].zonaKode).toBe("GUDANG")
    state = reducer(state, { type: "HAPUS_PEKERJA", kode: worker.kode, expectedRevision: 2 })
    expect(state.notice?.tipe).toBe("error")
    state = reducer(state, { type: "ARSIP_PEKERJA", kode: worker.kode, archived: true, expectedRevision: 2 })
    expect(managementOf(state).workers[0].diarsipkan).toBe(true)
    expect(state.pekerja[0].diarsipkan).toBe(false)
    expect(reducer(state, { ...create, tanggal: "2026-11-01" }).notice?.tipe).toBe("error")
    state = reducer(state, { type: "ARSIP_PEKERJA", kode: worker.kode, archived: false, expectedRevision: 3 })
    expect(managementOf(state).workers[0].diarsipkan).toBe(false)
  })
  it("enforces permissions in the reducer", () => {
    const state = run(emptyWorkspaceState(date), { type: "LOGIN", userId: "mandor-budi" }, add)
    expect(managementOf(state).workers).toHaveLength(0)
    const data = run(emptyWorkspaceState(date), { type: "LOGIN", userId: "data-tono" }, add, create)
    expect(managementOf(data).workers).toHaveLength(1)
    expect(managementOf(data).shifts).toHaveLength(0)
  })
})

describe("explicit shift lifecycle", () => {
  it("rejects empty, duplicate, unavailable, and future participants", () => {
    const state = run(emptyWorkspaceState(date), add)
    for (const workerCodes of [[], ["PK01", "PK01"], ["missing"]]) expect(reducer(state, { ...create, workerCodes }).notice?.tipe).toBe("error")
    expect(reducer(state, { ...create, tanggal: "2026-10-30" }).notice?.tipe).toBe("error")
    expect(reducer(draft(), create).notice?.tipe).toBe("error")
  })
  it("creates, edits and deletes a draft while keeping worker master data", () => {
    let state = run(draft(), { type: "UBAH_SHIFT", shiftId: date, nama: "Shift diperbarui", workerCodes: [worker.kode] })
    expect(currentShift(state)?.nama).toBe("Shift diperbarui")
    expect(state.kehadiran.at(-1)?.status).toBe("HADIR")
    state = reducer(state, { type: "HAPUS_SHIFT", shiftId: date })
    expect(currentShift(state)).toBeUndefined()
    expect(state.pekerja).toHaveLength(0)
    expect(managementOf(state).workers).toHaveLength(1)
  })
  it("blocks publishing before approval and sharing before publication", () => {
    expect(reducer(draft(), { type: "TERBITKAN_SHIFT", shiftId: date }).notice?.tipe).toBe("error")
    const state = reducer(approved(), { type: "BAGIKAN", reguKode: "COR", kanal: "manual" })
    expect(state.pengiriman).toHaveLength(0)
    expect(state.notice?.tipe).toBe("error")
  })
  it("blocks participant deletion once approval creates actionable history", () => {
    const state = approved()
    expect(reducer(state, { type: "HAPUS_SHIFT", shiftId: date }).notice?.tipe).toBe("error")
    expect(reducer(state, { type: "UBAH_SHIFT", shiftId: date, nama: "Changed", workerCodes: [worker.kode] }).notice?.tipe).toBe("error")
  })
  it("publishes, acknowledges, reports, verifies and explicitly closes", () => {
    const state = verified()
    expect(currentShift(state)?.status).toBe("ACTIVE")
    expect(state.tindakan.every(action => action.status === "TERVERIFIKASI")).toBe(true)
    const closed = reducer(state, { type: "TUTUP_SHIFT", shiftId: date })
    expect(currentShift(closed)?.status).toBe("CLOSED")
    expect(currentShift(closed)?.ditutupOleh).toBe("Ratna")
    expect(currentShift(readDemoState(JSON.stringify(closed)))?.status).toBe("CLOSED")
  })
  it("requires all actions to be verified, including multiple actions for one plan", () => {
    const state = verified()
    const action = state.tindakan[0]
    const multiple = { ...state, tindakan: [...state.tindakan, { ...action, id: `${action.id}-extra`, status: "TINDAKAN_DILAPORKAN" as const }] }
    expect(reducer(multiple, { type: "TUTUP_SHIFT", shiftId: date }).notice?.tipe).toBe("error")
    const completed = reducer(multiple, { type: "VERIFIKASI", tindakanId: `${action.id}-extra`, hasil: "TERVERIFIKASI", menit: 85 })
    expect(currentShift(reducer(completed, { type: "TUTUP_SHIFT", shiftId: date }))?.status).toBe("CLOSED")
  })
  it("allows returned reports to be corrected and reverified without duplication", () => {
    let state = reported()
    const id = state.tindakan[0].id
    state = run(state, { type: "VERIFIKASI", tindakanId: id, hasil: "BELUM_SELESAI", menit: 0 }, { type: "LOGIN", userId: "mandor-budi" }, { type: "LAPOR", tindakanId: id, dijalankan: true, pelaksana: "Budi", waktu: "15:30", menit: 80 })
    expect(state.tindakan.find(action => action.id === id)?.status).toBe("TINDAKAN_DILAPORKAN")
    expect(state.tindakan.find(action => action.id === id)?.waktuVerifikasi).toBeUndefined()
    expect(state.tindakan.filter(action => action.id === id)).toHaveLength(1)
  })
  it("locks closed shift writes but allows reusable master edits and a new shift", () => {
    const state = reducer(verified(), { type: "TUTUP_SHIFT", shiftId: date })
    const blocked = reducer(state, { type: "UBAH_PENUGASAN", pekerjaKode: worker.kode, zonaKode: "COR_B", tugasKode: "ANGKUT" })
    expect(blocked.penugasan).toEqual(state.penugasan)
    expect(blocked.notice?.tipe).toBe("error")
    let next = reducer(state, { type: "SIMPAN_PEKERJA", input: { ...worker, nama: "Adi baru" }, previousCode: worker.kode, expectedRevision: 1 })
    next = reducer(next, { ...create, tanggal: "2026-11-01" })
    expect(next.pekerja[0].nama).toBe("Adi baru")
    next = reducer(next, { type: "BUKA_SHIFT", shiftId: date })
    expect(currentShift(next)?.status).toBe("CLOSED")
    expect(next.pekerja[0].nama).toBe("Adi")
    expect(monthlyExposure(next, USERS[0])[0].verifiedMinutes).toBe(85)
  })
  it("requires a selected shift for operational writes and rejects unknown date switches", () => {
    const empty = reducer(emptyWorkspaceState(date), { type: "HITUNG_RENCANA" })
    expect(empty.rencanaDihitung).toBe(false)
    const state = reducer(draft(), { type: "SET_TANGGAL", tanggal: "2026-11-02" })
    expect(state.tanggal).toBe(date)
    expect(state.notice?.tipe).toBe("error")
  })
  it("checkpoints drafts when switching and denies another crew access", () => {
    let state = run(draft(), { type: "KONFIRMASI", pekerjaKode: worker.kode, profil: "NORMAL", hari: 1 }, { ...create, tanggal: "2026-11-01" }, { type: "BUKA_SHIFT", shiftId: date })
    expect(state.konfirmasi[0].profil).toBe("NORMAL")
    state = run(state, { type: "LOGIN", userId: "mandor-sari" }, { type: "BUKA_SHIFT", shiftId: "2026-11-01" })
    expect(state.tanggal).toBe(date)
    expect(state.notice?.tipe).toBe("error")
  })
  it("rejects invalid durations and unsafe missing participant updates", () => {
    const state = reported()
    expect(reducer(state, { type: "VERIFIKASI", tindakanId: state.tindakan[0].id, hasil: "TERVERIFIKASI", menit: Number.NaN }).notice?.tipe).toBe("error")
    expect(reducer(state, { type: "UBAH_PENUGASAN", pekerjaKode: "missing", zonaKode: "GUDANG", tugasKode: "ANGKUT" }).notice?.tipe).toBe("error")
  })
  it("preserves legacy saved data and refuses malformed new snapshots", () => {
    const legacy = initialDemoState(date)
    const migrated = ensureManagement(readDemoState(JSON.stringify(legacy)))
    expect(migrated.pekerja).toEqual(legacy.pekerja)
    expect(currentShift(migrated)?.status).toBe("ACTIVE")
    const state = draft()
    const invalid = { ...state, management: { ...state.management, shifts: [{ ...currentShift(state), workspace: {} }] } }
    expect(() => readDemoState(JSON.stringify(invalid))).toThrow("Invalid shift snapshots")
  })
})

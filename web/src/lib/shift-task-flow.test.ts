import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, rencanaAktif, type Action, type AppState } from "./store"
import { shiftTaskFlow } from "./shift-task-flow"
import { managementOf } from "./management-state"
import { JAM_SHIFT, USERS, ZONA } from "./config"
import type { IotEvent } from "./iot"

const date = "2026-10-31"
const hse = USERS[0], foreman = USERS[1]
const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state)
/** Station readings for every zone and shift hour (8 five-minute slots, the minimum for a valid hour), as terma-iot delivers them. */
const stationDay: Action = { type: "TERIMA_IOT", events: ZONA.flatMap((zone, z) => JAM_SHIFT.flatMap((hour, h) => Array.from({ length: 8 }, (_, slot): IotEvent => ({ type: "station", deviceId: `TST-${zone.kode}`, zone: zone.kode, airC: 31, humidityPct: 60, wetBulbC: 25, seq: z * 1000 + h * 10 + slot + 1, receivedAt: new Date(`${date}T${String(hour).padStart(2, "0")}:${String(slot * 5).padStart(2, "0")}:00+07:00`).toISOString() })))) }
function draft(twoCrews = false) {
  let state = emptyWorkspaceState(date)
  for (const [kode, reguKode] of twoCrews ? [["W01", "COR"], ["W02", "BEK"]] : [["W01", "COR"]]) state = reducer(state, { type: "SIMPAN_PEKERJA", input: { kode, nama: kode, reguKode, tanggalMulai: date, tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
  return reducer(state, { type: "BUAT_SHIFT", tanggal: date, nama: "Shift pagi", workerCodes: managementOf(state).workers.map(worker => worker.kode) })
}
function published(twoCrews = false) {
  let state = draft(twoCrews)
  for (const worker of state.pekerja) state = run(state, { type: "CATAT_CHECKIN", persetujuan: true, pekerjaKode: worker.kode, kondisi: "BAIK", keluhan: [] }, { type: "TINJAU_KONDISI", pekerjaKode: worker.kode, hasil: "LANJUT_TINJAU_RENCANA", catatan: "Kondisi awal dan data tersedia ditinjau sesuai SOP" }, { type: "KONFIRMASI", pekerjaKode: worker.kode, profil: "PEKERJA_BARU", hari: 1 })
  state = run(state, stationDay, { type: "HITUNG_RENCANA" })
  for (const plan of rencanaAktif(state)) state = reducer(state, { type: "SETUJUI", rencanaId: plan.id })
  return reducer(state, { type: "TERBITKAN_SHIFT", shiftId: date })
}
function reported() {
  let state = run(published(), { type: "BAGIKAN", reguKode: "COR", kanal: "manual" }, { type: "LOGIN", userId: foreman.id })
  state = reducer(state, { type: "AKUI", pengirimanId: state.pengiriman[0].id })
  for (const action of state.tindakan) state = reducer(state, { type: "LAPOR", tindakanId: action.id, dijalankan: true, pelaksana: "Budi", waktu: "15:00", menit: 90 })
  return reducer(state, { type: "LOGIN", userId: hse.id })
}

describe("focused shift task flow", () => {
  it("allows plan review after HR/adaptation while full-day sensor data and check-in stay separate", () => {
    let state = draft()
    expect(shiftTaskFlow(state,hse).current).toBe(0)
    state = run(state, { type: "CATAT_CHECKIN", persetujuan: true, pekerjaKode: "W01", kondisi: "BAIK", keluhan: [] }, { type: "TINJAU_KONDISI", pekerjaKode: "W01", hasil: "LANJUT_TINJAU_RENCANA", catatan: "Kondisi awal dan data tersedia ditinjau sesuai SOP" }, { type: "KONFIRMASI", pekerjaKode: "W01", profil: "PEKERJA_BARU", hari: 1 })
    expect(shiftTaskFlow(state,hse).current).toBe(2)
    expect(shiftTaskFlow(state,hse).steps[1].optional).toBe(true)
    state = run(state, stationDay, { type: "HITUNG_RENCANA" })
    expect(shiftTaskFlow(state,hse).current).toBe(2)
    for (const plan of rencanaAktif(state)) state = reducer(state, { type: "SETUJUI", rencanaId: plan.id })
    expect(shiftTaskFlow(state,hse).current).toBe(2)
    state = reducer(state, { type: "TERBITKAN_SHIFT", shiftId: date })
    expect(shiftTaskFlow(state,hse).current).toBe(3)
  })
  it("distinguishes sharing, acknowledgement, reporting, verification and closure", () => {
    let state = published()
    expect(shiftTaskFlow(state,hse).steps[3].owners).toEqual(["HSE"])
    state = reducer(state, { type: "BAGIKAN", reguKode: "COR", kanal: "manual" })
    expect(shiftTaskFlow(state,hse).steps[3].owners).toEqual(["MANDOR"])
    expect(shiftTaskFlow(state,hse).current).toBe(3)
    state = run(state, { type: "LOGIN", userId: foreman.id }, { type: "AKUI", pengirimanId: state.pengiriman[0].id })
    expect(shiftTaskFlow(state,foreman).current).toBe(4)
    state = reported()
    expect(shiftTaskFlow(state,hse).current).toBe(5)
    for (const action of state.tindakan) state = reducer(state, { type: "VERIFIKASI", tindakanId: action.id, hasil: "TERVERIFIKASI", menit: 85 })
    expect(shiftTaskFlow(state,hse).verified).toBe(true)
    expect(shiftTaskFlow(state,hse).steps[5].done).toBe(false)
    state = reducer(state, { type: "TUTUP_SHIFT", shiftId: date })
    expect(shiftTaskFlow(state,hse).steps.every(step => step.done)).toBe(true)
  })
  it("returns to execution when HSE returns a report", () => {
    let state = reported()
    state = reducer(state, { type: "VERIFIKASI", tindakanId: state.tindakan[0].id, hasil: "BELUM_SELESAI", menit: 0 })
    expect(shiftTaskFlow(state,hse).current).toBe(4)
    expect(shiftTaskFlow(state,hse).verified).toBe(false)
  })
  it("lets each foreman continue their crew while keeping HSE's whole-shift progress incomplete", () => {
    let state = run(published(true), { type: "BAGIKAN", reguKode: "COR", kanal: "manual" })
    expect(shiftTaskFlow(state,hse).allShared).toBe(false)
    expect(shiftTaskFlow(state,hse).steps[3].owners).toEqual(["HSE"])
    state = reducer(state, { type: "BAGIKAN", reguKode: "BEK", kanal: "manual" })
    const delivery = state.pengiriman.find(row => row.reguKode === "COR")
    if (!delivery) throw new Error("Expected shared COR instructions")
    state = run(state, { type: "LOGIN", userId: foreman.id }, { type: "AKUI", pengirimanId: delivery.id })
    expect(shiftTaskFlow(state,foreman).current).toBe(4)
    expect(shiftTaskFlow(state,foreman).actions.every(action => action.reguKode === "COR")).toBe(true)
    expect(shiftTaskFlow(state,hse).current).toBe(3)
  })
})

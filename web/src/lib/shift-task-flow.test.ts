import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, rencanaAktif, type Action, type AppState } from "./store"
import { shiftTaskFlow } from "./shift-task-flow"
import { USERS } from "./config"
import { managementOf } from "./management-state"

const date = "2026-10-31"
const hse = USERS[0], foreman = USERS[1]
const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state)
function draft(twoCrews = false) {
  let state = emptyWorkspaceState(date)
  for (const [kode, reguKode] of twoCrews ? [["W01", "COR"], ["W02", "BEK"]] : [["W01", "COR"]]) state = reducer(state, { type: "SIMPAN_PEKERJA", input: { kode, nama: kode, reguKode, tanggalMulai: date, tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
  return reducer(state, { type: "BUAT_SHIFT", tanggal: date, nama: "Shift pagi", workerCodes: managementOf(state).workers.map(worker => worker.kode) })
}
function published(twoCrews = false) {
  let state = draft(twoCrews)
  for (const worker of state.pekerja) state = reducer(state, { type: "KONFIRMASI", pekerjaKode: worker.kode, profil: "PEKERJA_BARU", hari: 1 })
  state = run(state, { type: "AMBIL_BACAAN_PERANGKAT" }, { type: "HITUNG_RENCANA" })
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
  it("requires preparation, saved sensor readings, approval and explicit publication in sequence", () => {
    let state = draft()
    expect(shiftTaskFlow(state,hse).current).toBe(0)
    state = reducer(state, { type: "KONFIRMASI", pekerjaKode: "W01", profil: "PEKERJA_BARU", hari: 1 })
    expect(shiftTaskFlow(state,hse).current).toBe(1)
    state = run(state, { type: "AMBIL_BACAAN_PERANGKAT" }, { type: "HITUNG_RENCANA" })
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

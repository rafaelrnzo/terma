import { describe, expect, it } from "vitest"
import { USERS } from "./config"
import { reducer, rencanaAktif, stateAwal, type Action, type AppState } from "./store"
import { nextWorkflowStep, workflow } from "./workflow"
import { T_CSV_PEKERJA, T_TANGGAL, tCsvKehadiran, tCsvWbgt } from "./test-fixtures"

const hse = USERS.find((u) => u.role === "HSE")!
const mandor = USERS.find((u) => u.id === "mandor-budi")!
const run = (s: AppState, ...actions: Action[]) => actions.reduce(reducer, s)
const step = (s: AppState, href: string, user = hse) => workflow(s, user).find((x) => x.href === href)!
function populated() {
  return run(stateAwal(T_TANGGAL),
    { type: "IMPOR_PEKERJA", csv: T_CSV_PEKERJA, source: "fixture.csv" },
    { type: "IMPOR_KEHADIRAN", csv: tCsvKehadiran(), source: "fixture.csv" },
    { type: "IMPOR_PENGUKURAN", csv: tCsvWbgt(), source: "fixture.csv" },
    { type: "HITUNG_RENCANA" },
  )
}

describe("daily workflow guidance", () => {
  it("guides a new HSE user to import, and a foreman to instructions", () => {
    expect(nextWorkflowStep(stateAwal(T_TANGGAL), hse).href).toBe("/impor")
    expect(nextWorkflowStep(stateAwal(T_TANGGAL), mandor).href).toBe("/instruksi")
  })
  it("does not require a worker starting today to have historical attendance", () => {
    expect(step(populated(), "/impor").selesai).toBe(true)
    expect(nextWorkflowStep(populated(), hse).href).toBe("/paparan")
  })
  it("includes incomplete histories in the confirmation progress", () => {
    const s = run(populated(),
      { type: "KONFIRMASI", pekerjaKode: "W001", profil: "PEKERJA_BARU", hari: 1 },
      { type: "KONFIRMASI", pekerjaKode: "W003", profil: "BERPENGALAMAN_KEMBALI", hari: 1 },
    )
    expect(step(s, "/paparan").selesai).toBe(false)
    expect(step(s, "/paparan").progress).toBe("2/3 pekerja dikonfirmasi")
  })
  it("requires coverage of all assigned zone-hours, scoped by crew and date", () => {
    const s = populated()
    expect(step(s, "/pengukuran").progress).toBe("16/24 interval dengan bacaan valid")
    expect(step(s, "/pengukuran").selesai).toBe(false)
    expect(step(s, "/pengukuran", mandor).selesai).toBe(true)
    expect(step({ ...s, tanggal: "2026-10-25" }, "/pengukuran", mandor).selesai).toBe(false)
    expect(step({ ...s, bacaan: s.bacaan.slice(0, 1) }, "/pengukuran").selesai).toBe(false)
  })
  it("does not mark approvals complete after one plan or a previous date", () => {
    let s = populated()
    s = run(s, { type: "SETUJUI", rencanaId: rencanaAktif(s)[0].id })
    expect(step(s, "/rencana").selesai).toBe(false)
    expect(step(s, "/rencana").progress).toBe("1/7 rencana disetujui")
    for (const r of rencanaAktif(s)) s = run(s, { type: "SETUJUI", rencanaId: r.id })
    expect(step(s, "/rencana").selesai).toBe(true)
    expect(step({ ...s, tanggal: "2026-10-25" }, "/rencana").selesai).toBe(false)
  })
  it("requires current plan versions and all scoped actions, not historical acknowledgements", () => {
    let s = populated()
    for (const r of rencanaAktif(s)) s = run(s, { type: "SETUJUI", rencanaId: r.id })
    s = run(s, { type: "BAGIKAN", reguKode: "COR", kanal: "manual" })
    s = { ...s, pengiriman: s.pengiriman.map((p) => ({ ...p, diakui: true })) }
    expect(step(s, "/instruksi").selesai).toBe(false)
    expect(step(s, "/instruksi", mandor).selesai).toBe(true)
    s = { ...s, tindakan: s.tindakan.map((t, i) => ({ ...t, status: i === 0 ? "TERVERIFIKASI" : t.status })) }
    expect(step(s, "/tindakan").selesai).toBe(false)
    s = { ...s, tindakan: s.tindakan.map((t) => ({ ...t, status: "TERVERIFIKASI" })) }
    expect(step(s, "/tindakan", mandor).selesai).toBe(true)
    expect(step({ ...s, tanggal: "2026-10-25" }, "/tindakan", mandor).selesai).toBe(false)
    s = run(s, { type: "UBAH_PENUGASAN", pekerjaKode: "W001", zonaKode: "GUDANG", tugasKode: "PEMERIKSAAN" })
    expect(step(s, "/instruksi", mandor).selesai).toBe(false)
    expect(step(s, "/tindakan", mandor).selesai).toBe(false)
  })
})

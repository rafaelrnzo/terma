import { describe, expect, it } from "vitest"
import { reducer, rencanaAktif, stateAwal, type Action, type AppState } from "./store"
import { T_CSV_PEKERJA, T_CSV_PRAKIRAAN, T_TANGGAL, tCsvKehadiran, tCsvWbgt } from "./test-fixtures"

const run = (s: AppState, ...actions: Action[]) => actions.reduce(reducer, s)
const login = (userId: string): Action => ({ type: "LOGIN", userId })

function siapRencana(): AppState {
  return run(
    stateAwal(T_TANGGAL),
    login("data-tono"),
    { type: "IMPOR_PEKERJA", csv: T_CSV_PEKERJA, source: "pekerja.csv" },
    { type: "IMPOR_KEHADIRAN", csv: tCsvKehadiran(), source: "kehadiran.csv" },
    { type: "IMPOR_PENGUKURAN", csv: tCsvWbgt(), source: "wbgt.csv" },
    { type: "IMPOR_PRAKIRAAN", csv: T_CSV_PRAKIRAAN, source: "bmkg.csv" },
    login("hse-ratna"),
    { type: "KONFIRMASI", pekerjaKode: "W001", profil: "PEKERJA_BARU", hari: 1 },
    { type: "KONFIRMASI", pekerjaKode: "W003", profil: "BERPENGALAMAN_KEMBALI", hari: 1 },
    { type: "HITUNG_RENCANA" },
  )
}

describe("session", () => {
  it("opens as the HSE user", () => {
    expect(stateAwal(T_TANGGAL).sesi?.userId).toBe("hse-ratna")
  })
  it("rejects every write without an active user", () => {
    const s = run({ ...stateAwal(T_TANGGAL), sesi: null }, { type: "IMPOR_PEKERJA", csv: T_CSV_PEKERJA, source: "a.csv" })
    expect(s.pekerja).toHaveLength(0)
    expect(s.notice?.tipe).toBe("error")
  })
  it("switching user is audited", () => {
    const s = run(stateAwal(T_TANGGAL), login("mandor-budi"))
    expect(s.sesi?.userId).toBe("mandor-budi")
    expect(s.audit[0].aksi).toBe("GANTI_PENGGUNA")
  })
})

describe("import", () => {
  it("rejects invalid rows with reasons and re-import does not duplicate", () => {
    const s1 = run(stateAwal(T_TANGGAL), login("data-tono"), { type: "IMPOR_PEKERJA", csv: T_CSV_PEKERJA, source: "a.csv" })
    expect(s1.pekerja).toHaveLength(7)
    expect(s1.pekerja.every((p) => p.origin === "AKTUAL")).toBe(true)
    expect(s1.imporLog[0].ditolak.map((d) => d.alasan)).toEqual([
      "Identitas duplikat dalam berkas: W002",
      "Tanggal tidak masuk akal: 2024-02-30",
      "Zona tidak dikenal: ZONA_X",
    ])
    const s2 = run(s1, { type: "IMPOR_PEKERJA", csv: T_CSV_PEKERJA, source: "a.csv" })
    expect(s2.pekerja).toHaveLength(7)
    expect(s2.imporLog[0].baru).toBe(0)
    const k1 = run(s2, { type: "IMPOR_KEHADIRAN", csv: tCsvKehadiran(), source: "k.csv" })
    const k2 = run(k1, { type: "IMPOR_KEHADIRAN", csv: tCsvKehadiran(), source: "k.csv" })
    expect(k2.kehadiran.length).toBe(k1.kehadiran.length)
  })

  it("WBGT import validates zone, keeps one reading per zone-hour, and re-import does not duplicate", () => {
    const s1 = run(stateAwal(T_TANGGAL), login("data-tono"), { type: "IMPOR_PENGUKURAN", csv: tCsvWbgt(), source: "w.csv" })
    expect(s1.bacaan).toHaveLength(16)
    expect(s1.imporLog[0].ditolak[0].alasan).toBe("Zona tidak dikenal: ZONA_X")
    const s2 = run(s1, { type: "IMPOR_PENGUKURAN", csv: tCsvWbgt(), source: "w.csv" })
    expect(s2.bacaan).toHaveLength(16)
  })
})

describe("plans and decision contract", () => {
  it("produces the expected status per worker", () => {
    const st = Object.fromEntries(rencanaAktif(siapRencana()).map((r) => [r.pekerjaKode, r.status]))
    expect(st).toEqual({
      W001: "BATASI_ATAU_PINDAHKAN",
      W002: "BATASI_ATAU_PINDAHKAN",
      W003: "BATASI_ATAU_PINDAHKAN",
      W007: "RENCANA_TERSEDIA",
      W004: "TINJAU_HSE",
      W005: "TINJAU_HSE",
      W006: "RENCANA_TERSEDIA",
    })
    expect(rencanaAktif(siapRencana()).find((r) => r.pekerjaKode === "W001")!.batasHarianMenit).toBe(96)
  })

  it("a change after approval creates a new version that needs re-approval and keeps the old one", () => {
    let s = run(siapRencana(), { type: "SETUJUI", rencanaId: `W003-v1@${T_TANGGAL}` })
    s = run(s, { type: "UBAH_PENUGASAN", pekerjaKode: "W003", zonaKode: "GUDANG", tugasKode: "PEMBESIAN" })
    const v1 = s.rencana.find((r) => r.id === `W003-v1@${T_TANGGAL}`)!
    const v2 = s.rencana.find((r) => r.id === `W003-v2@${T_TANGGAL}`)!
    expect(v1.digantikan).toBe(true)
    expect(v1.disetujuiOleh).toBe("Ratna")
    expect(v2.disetujuiOleh).toBeUndefined()
    expect(v2.status).toBe("ADAPTASI_DIPERLUKAN")
    expect(v2.batasHarianMenit).toBe(240)
  })

  it("plans belong to a date: changing the date gives a separate plan set", () => {
    const s = run(siapRencana(), { type: "SET_TANGGAL", tanggal: "2026-10-25" })
    const besok = rencanaAktif(s)
    expect(besok.every((r) => r.tanggal === "2026-10-25")).toBe(true)
    // no readings for that date: nothing may be ready
    expect(besok.every((r) => r.status !== "RENCANA_TERSEDIA")).toBe(true)
  })
})

describe("roles are enforced in the data layer", () => {
  it("foreman cannot approve plans, and cannot acknowledge another crew's message", () => {
    const id = `W007-v1@${T_TANGGAL}`
    let s = run(siapRencana(), login("mandor-budi"), { type: "SETUJUI", rencanaId: id })
    expect(s.rencana.find((r) => r.id === id)!.disetujuiOleh).toBeUndefined()
    expect(s.audit[0].aksi).toBe("AKSES_DITOLAK")

    s = run(s, login("hse-ratna"), { type: "SETUJUI", rencanaId: `W006-v1@${T_TANGGAL}` }, { type: "BAGIKAN", reguKode: "BEK", kanal: "WhatsApp" })
    const pesanBek = s.pengiriman.find((p) => p.reguKode === "BEK")!
    s = run(s, login("mandor-budi"), { type: "AKUI", pengirimanId: pesanBek.id })
    expect(s.pengiriman.find((p) => p.id === pesanBek.id)!.diakui).toBe(false)
    expect(s.audit[0].aksi).toBe("AKSES_DITOLAK")
  })
})

describe("follow-up lifecycle", () => {
  it("shared is never TERKIRIM; failure reverts to undelivered; acknowledged is not reported; resubmit does not duplicate", () => {
    const rid = `W007-v1@${T_TANGGAL}`
    let s = run(siapRencana(), { type: "SETUJUI", rencanaId: rid }, { type: "BAGIKAN", reguKode: "COR", kanal: "WhatsApp" })
    const t = () => s.tindakan.find((x) => x.rencanaId === rid)!
    expect(s.pengiriman[0].status).toBe("DIBAGIKAN_MANUAL")
    expect(t().status).toBe("DISAMPAIKAN")

    s = run(s, { type: "TANDAI_GAGAL", pengirimanId: s.pengiriman[0].id, alasan: "Nomor mandor tidak aktif" })
    expect(s.pengiriman[0].status).toBe("GAGAL")
    expect(t().status).toBe("DIBUAT")

    s = run(s, { type: "BAGIKAN", reguKode: "COR", kanal: "WhatsApp" })
    expect(s.pengiriman.filter((p) => p.reguKode === "COR")).toHaveLength(1)
    expect(s.pengiriman[0].status).toBe("DIBAGIKAN_MANUAL")

    s = run(s, login("mandor-budi"), { type: "AKUI", pengirimanId: s.pengiriman[0].id })
    expect(t().status).toBe("DIAKUI")

    const lapor: Action = { type: "LAPOR", tindakanId: t().id, dijalankan: true, pelaksana: "Budi", waktu: "08:05", menit: 470 }
    s = run(s, lapor, lapor)
    expect(s.tindakan.filter((x) => x.rencanaId === rid)).toHaveLength(1)
    expect(t().status).toBe("TINDAKAN_DILAPORKAN")

    s = run(s, login("hse-ratna"), { type: "VERIFIKASI", tindakanId: t().id, hasil: "TERVERIFIKASI", menit: 460 })
    expect(t().status).toBe("TERVERIFIKASI")
    expect([t().menitDirencanakan, t().menitDilaporkan, t().menitDiverifikasi]).toEqual([480, 470, 460])
  })
})

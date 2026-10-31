import { describe, expect, it } from "vitest"
import { ATURAN_FIXTURE, TUGAS } from "./config"
import { T_PRAKIRAAN, T_TANGGAL, tBacaan } from "./test-fixtures"
import { cariBaris, deteksiKandidat, hitungRencana, persenAdaptasi } from "./rules"
import type { Kehadiran, KonfirmasiPaparan, Pekerja, Penugasan } from "./types"

const tugas = (k: string) => TUGAS.find((t) => t.kode === k)!
const pekerja = (kode: string, tanggalMulai = "2020-01-01"): Pekerja => ({
  kode,
  nama: kode,
  reguKode: "COR",
  tanggalMulai,
  source: "test",
  origin: "AKTUAL",
})
const penugasan = (kode: string, tugasKode: string, zonaKode: string, apd = "Standar"): Penugasan => ({
  pekerjaKode: kode,
  tugasKode,
  zonaKode,
  apd,
  apdBerubah: false,
  version: 1,
})
const hadirPenuh = (kode: string): Kehadiran[] =>
  ["17", "18", "19", "20", "21", "22", "23"].map((d) => ({
    pekerjaKode: kode,
    tanggal: `2026-10-${d}`,
    status: "HADIR",
    source: "test",
  }))
const konf = (kode: string, profil: KonfirmasiPaparan["profil"], hari = 1): KonfirmasiPaparan => ({
  pekerjaKode: kode,
  profil,
  hariAdaptasi: hari,
  dikonfirmasiOleh: "HSE",
  waktu: "t",
})

function run(p: Pekerja, pn: Penugasan, keh: Kehadiran[], k?: KonfirmasiPaparan, bacaan = tBacaan()) {
  return hitungRencana({
    tanggal: T_TANGGAL,
    pekerja: p,
    penugasan: pn,
    tugas: tugas(pn.tugasKode),
    kandidat: deteksiKandidat(p, keh, T_TANGGAL),
    konfirmasi: k,
    bacaan,
    prakiraan: T_PRAKIRAAN,
    aturan: ATURAN_FIXTURE,
  })
}

describe("NIOSH acclimatization schedule", () => {
  it("does not treat today's roster or future attendance as a new worker's prior history", () => {
    const worker = pekerja("NEW", T_TANGGAL)
    const records: Kehadiran[] = [T_TANGGAL, "2026-10-25"].map(tanggal => ({ pekerjaKode: worker.kode, tanggal, status: "HADIR", source: "Roster" }))
    const candidate = deteksiKandidat(worker, records, T_TANGGAL)
    expect(candidate.pemicu).toBe("PEKERJA_BARU")
    expect(candidate.saranProfil).toBe("PEKERJA_BARU")
    expect(candidate.catatanKehadiran).toBe(0)
  })
  it("new worker: 20% then +20 points per day", () => {
    expect([1, 2, 3, 4, 5].map((d) => persenAdaptasi("PEKERJA_BARU", d))).toEqual([20, 40, 60, 80, 100])
  })
  it("experienced returning: 50/60/80/100", () => {
    expect([1, 2, 3, 4].map((d) => persenAdaptasi("BERPENGALAMAN_KEMBALI", d))).toEqual([50, 60, 80, 100])
  })
})

describe("reading age is measured against the interval it covers", () => {
  it("a 06:30 reading reused for the 12.00 interval is stale; a 12:05 reading is fresh", () => {
    const base = tBacaan().filter((b) => b.zonaKode === "GUDANG")
    const early = base.map((b) => (b.jamMulai === 12 ? { ...b, waktuCatat: `${T_TANGGAL}T06:30:00` } : b))
    const r1 = run(pekerja("W007"), penugasan("W007", "ANGKUT", "GUDANG"), hadirPenuh("W007"), undefined, early)
    expect(r1.intervals.find((i) => i.jamMulai === 12)!.kualitas).toBe("KEDALUWARSA")
    const r2 = run(pekerja("W007"), penugasan("W007", "ANGKUT", "GUDANG"), hadirPenuh("W007"), undefined, base)
    expect(r2.intervals.find((i) => i.jamMulai === 12)!.kualitas).toBe("TERUKUR")
  })
})

describe("PRD acceptance cases", () => {
  it("new worker day 1: daily limit 96 minutes and interval limits still checked", () => {
    const p = pekerja("W001", "2026-10-24")
    const r = run(p, penugasan("W001", "PENGECORAN", "COR_B"), [], konf("W001", "PEKERJA_BARU", 1))
    expect(r.batasHarianMenit).toBe(96)
    expect(r.totalKerjaMenit).toBeLessThanOrEqual(96)
    for (const iv of r.intervals) expect(iv.kerjaDirencanakan).toBeLessThanOrEqual(iv.kerjaMaksMenit)
  })

  it("new worker without HSE confirmation is not automatically planned", () => {
    const r = run(pekerja("W001", "2026-10-24"), penugasan("W001", "PENGECORAN", "GUDANG"), [])
    expect(r.status).toBe("TINJAU_HSE")
    expect(r.totalKerjaMenit).toBe(0)
  })

  it("several conditions: the most restrictive status wins", () => {
    // unconfirmed (TINJAU HSE) + 31,8°C heavy work (BATASI) in the same plan
    const r = run(pekerja("W001", "2026-10-24"), penugasan("W001", "PENGECORAN", "COR_B"), [])
    expect(r.status).toBe("BATASI_ATAU_PINDAHKAN")
    expect(r.totalKerjaMenit).toBe(0)
    expect(r.alasan.some((a) => a.includes("belum dikonfirmasi"))).toBe(true)
  })

  it("returning after 7+ days without exposure needs confirmation, not auto normal", () => {
    const keh: Kehadiran[] = Array.from({ length: 10 }, (_, i) => ({
      pekerjaKode: "W003",
      tanggal: `2026-10-${String(14 + i).padStart(2, "0")}`,
      status: "CUTI",
      source: "test",
    }))
    const r = run(pekerja("W003"), penugasan("W003", "PEMBESIAN", "GUDANG"), keh)
    expect(r.status).toBe("TINJAU_HSE")
    const ok = run(pekerja("W003"), penugasan("W003", "PEMBESIAN", "GUDANG"), keh, konf("W003", "BERPENGALAMAN_KEMBALI", 1))
    expect(ok.status).toBe("ADAPTASI_DIPERLUKAN")
    expect(ok.batasHarianMenit).toBe(240)
  })

  it("WBGT 31,8°C, heavy work, old fixture: no allocation, restrict or move, no 25–50% recommendation", () => {
    const r = run(pekerja("W002"), penugasan("W002", "PENGECORAN", "COR_B"), hadirPenuh("W002"))
    const noon = r.intervals.find((i) => i.jamMulai === 12)!
    expect(noon.isbb).toBe(31.8)
    expect(noon.kerjaDirencanakan).toBe(0)
    expect(noon.barisNab).toBeNull()
    expect(r.status).toBe("BATASI_ATAU_PINDAHKAN")
    expect(r.belumLayak).toBe(true)
  })

  it("empty NAB cell is unsupported, never zero", () => {
    const { row, kosong } = cariBaris(ATURAN_FIXTURE, "BERAT", 27.0)
    expect(kosong).toContain("75–100%")
    expect(row?.label).toBe("50–75%")
  })

  it("unsupported PPE goes to HSE review, no arbitrary correction", () => {
    const r = run(pekerja("W005"), penugasan("W005", "PENGELASAN", "GUDANG", "Coverall tertutup"), hadirPenuh("W005"))
    expect(r.status).toBe("TINJAU_HSE")
    expect(r.totalKerjaMenit).toBe(0)
  })

  it("forecast only: needs measurement and review, never a ready status", () => {
    const r = run(pekerja("W006"), penugasan("W006", "BEKISTING", "BEK_A"), hadirPenuh("W006"))
    expect(r.status).toBe("TINJAU_HSE")
    expect(r.kualitas).toBe("PRAKIRAAN_SAJA")
    expect(r.totalKerjaMenit).toBe(0)
  })

  it("stale reading: taken the day before the interval gives KEDALUWARSA and HSE review", () => {
    const stale = tBacaan().map((b) => ({ ...b, waktuCatat: "2026-10-23T08:00:00" }))
    const r = run(pekerja("W007"), penugasan("W007", "ANGKUT", "GUDANG"), hadirPenuh("W007"), undefined, stale)
    expect(r.kualitas).toBe("KEDALUWARSA")
    expect(r.status).toBe("TINJAU_HSE")
  })

  it("experienced worker in shaded zone with valid readings: plan available", () => {
    const r = run(pekerja("W007"), penugasan("W007", "ANGKUT", "GUDANG"), hadirPenuh("W007"))
    expect(r.status).toBe("RENCANA_TERSEDIA")
    expect(r.totalKerjaMenit).toBe(480)
  })
})

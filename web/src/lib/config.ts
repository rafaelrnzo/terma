// Site configuration: master data for one location (PRD P0 = one site, one assignment flow).
// In a deployment this comes from the backend's site config; the frontend reads it from here
// until the API exists.

import type { Aturan, Regu, Tugas, User, Zona } from "./types"

export const LOKASI = "Proyek Gedung · Lokasi 1"
export const NORMAL_PAPARAN_MENIT = 480 // planned normal exposure: 8 hours
export const JAM_SHIFT = [8, 9, 10, 11, 12, 13, 14, 15] // hourly intervals 08.00–16.00
/**
 * Maximum age of a WBGT reading relative to the start of the interval it covers. Set by HSE in
 * the site configuration (PRD F-ENV-03); a reading taken earlier than this is KEDALUWARSA.
 */
export const AMBANG_USIA_BACAAN_MENIT = 120

/** People at this site. The active user is picked in the header; roles limit what each can change. */
export const USERS: User[] = [
  { id: "hse-ratna", username: "ratna", nama: "Ratna", role: "HSE" },
  { id: "mandor-budi", username: "budi", nama: "Budi", role: "MANDOR", reguKode: "COR" },
  { id: "mandor-sari", username: "sari", nama: "Sari", role: "MANDOR", reguKode: "BEK" },
  { id: "data-tono", username: "tono", nama: "Tono", role: "PETUGAS_DATA" },
]

export const REGU: Regu[] = [
  { kode: "COR", nama: "Regu Cor", mandorId: "mandor-budi" },
  { kode: "BEK", nama: "Regu Bekisting", mandorId: "mandor-sari" },
]

export const ZONA: Zona[] = [
  { kode: "COR_B", nama: "Zona Cor B (terbuka)" },
  { kode: "BEK_A", nama: "Zona Bekisting A (terbuka)" },
  { kode: "GUDANG", nama: "Zona Gudang (teduh)" },
]

export const TUGAS: Tugas[] = [
  { kode: "PENGECORAN", nama: "Pengecoran", beban: "BERAT" },
  { kode: "PEMBESIAN", nama: "Pembesian", beban: "SEDANG" },
  { kode: "BEKISTING", nama: "Pemasangan bekisting", beban: "SEDANG" },
  { kode: "PENGELASAN", nama: "Pengelasan", beban: "SEDANG" },
  { kode: "ANGKUT", nama: "Angkut material ringan", beban: "SEDANG" },
  { kode: "PEMERIKSAAN", nama: "Pemeriksaan alat (teduh)", beban: "RINGAN" },
]

/**
 * NAB table transcribed from the first PRD, citing Permenaker 5/2018. Not yet verified against the
 * official text, so it stays labelled as a fixture rule (PRD F-RULE-01) until HSE approves it.
 * A missing key means the combination is unsupported, never zero.
 */
export const ATURAN_FIXTURE: Aturan = {
  kode: "NAB-FIXTURE",
  versi: "v0-fixture",
  sumber: "Tabel PRD awal, mengacu Permenaker 5/2018 (belum diverifikasi ke naskah resmi)",
  isFixture: true,
  apdDidukung: ["Standar"],
  rows: [
    { label: "75–100%", kerjaMaksMenit: 60, nab: { RINGAN: 31.0, SEDANG: 28.0 } },
    { label: "50–75%", kerjaMaksMenit: 45, nab: { RINGAN: 31.0, SEDANG: 29.0, BERAT: 27.5 } },
    { label: "25–50%", kerjaMaksMenit: 30, nab: { RINGAN: 32.0, SEDANG: 30.0, BERAT: 29.0, SANGAT_BERAT: 28.0 } },
    { label: "0–25%", kerjaMaksMenit: 15, nab: { RINGAN: 32.5, SEDANG: 31.5, BERAT: 30.5, SANGAT_BERAT: 30.0 } },
  ],
}

/** Today's date in local time, ISO yyyy-mm-dd. */
export function hariIni(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Start of an interval on a date, as local-time epoch ms. */
export function awalInterval(tanggal: string, jam: number): number {
  const [y, m, d] = tanggal.split("-").map(Number)
  return new Date(y, m - 1, d, jam, 0, 0).getTime()
}

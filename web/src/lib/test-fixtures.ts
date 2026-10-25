// Test-only data. Fixed synthetic values so rule and flow tests are repeatable.
// Never imported by app code.

import type { PengukuranWBGT, PrakiraanCuaca } from "./types"

export const T_TANGGAL = "2026-10-24"

export const T_CSV_PEKERJA = `kode_pekerja,nama,regu,tanggal_mulai,tugas,zona,apd
W001,Andi,COR,2026-10-24,PENGECORAN,COR_B,Standar
W002,Rudi,COR,2023-03-01,PENGECORAN,COR_B,Standar
W003,Dedi,COR,2021-07-12,PEMBESIAN,COR_B,Standar
W007,Hadi,COR,2022-11-01,ANGKUT,GUDANG,Standar
W004,Eko,BEK,2022-01-10,BEKISTING,BEK_A,Standar
W005,Fajar,BEK,2020-05-04,PENGELASAN,GUDANG,Coverall tertutup
W006,Gita,BEK,2019-09-09,ANGKUT,GUDANG,Standar
W002,Rudi (duplikat),COR,2023-03-01,PENGECORAN,COR_B,Standar
W008,Joko,COR,2024-02-30,PEMBESIAN,COR_B,Standar
W009,Lina,BEK,2024-05-01,BEKISTING,ZONA_X,Standar`

function days(from: string, to: string): string[] {
  const out: string[] = []
  const d = new Date(from + "T00:00:00Z")
  const end = new Date(to + "T00:00:00Z")
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/** Andi: new. Dedi: leave 14–23 Oct. Eko: no records after 17 Oct. Last two rows invalid. */
export function tCsvKehadiran(): string {
  const rows = ["kode_pekerja,tanggal,status"]
  for (const tgl of days("2026-10-10", "2026-10-23")) {
    for (const kode of ["W002", "W005", "W006", "W007"]) rows.push(`${kode},${tgl},HADIR`)
    rows.push(`W003,${tgl},${tgl <= "2026-10-13" ? "HADIR" : "CUTI"}`)
    if (tgl <= "2026-10-17") rows.push(`W004,${tgl},HADIR`)
  }
  rows.push("W099,2026-10-20,HADIR")
  rows.push("W006,2026-10-21,LIBURAN")
  return rows.join("\n")
}

const COR_B = [27.2, 28.4, 29.6, 30.6, 31.8, 31.2, 30.1, 28.9]
const GUDANG = [25.8, 26.4, 27.0, 27.5, 27.9, 27.6, 27.1, 26.5]
const JAM = [8, 9, 10, 11, 12, 13, 14, 15]
const at = (h: number, m = 5) => `${T_TANGGAL}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`

export function tCsvWbgt(): string {
  const rows = ["zona,tanggal,jam_mulai,isbb,id_alat,pencatat,kalibrasi,jenis,waktu_catat"]
  COR_B.forEach((v, i) => rows.push(`COR_B,${T_TANGGAL},${JAM[i]},${v},WBGT-01,Rekaman,Tidak tersedia,REPLAY,${at(JAM[i])}`))
  GUDANG.forEach((v, i) => rows.push(`GUDANG,${T_TANGGAL},${JAM[i]},${v},WBGT-02,Tono,Sertifikat 2026-08,TERUKUR,${at(JAM[i])}`))
  rows.push(`ZONA_X,${T_TANGGAL},8,27,WBGT-09,Tono,-,TERUKUR,${at(8)}`)
  return rows.join("\n")
}

export function tBacaan(): PengukuranWBGT[] {
  return [
    ...COR_B.map((isbb, i) => ({ zonaKode: "COR_B", tanggal: T_TANGGAL, jamMulai: JAM[i], isbb, idAlat: "WBGT-01", pencatat: "Rekaman", kalibrasi: "-", origin: "REPLAY" as const, waktuCatat: at(JAM[i]) })),
    ...GUDANG.map((isbb, i) => ({ zonaKode: "GUDANG", tanggal: T_TANGGAL, jamMulai: JAM[i], isbb, idAlat: "WBGT-02", pencatat: "Tono", kalibrasi: "-", origin: "AKTUAL" as const, waktuCatat: at(JAM[i]) })),
  ]
}

export const T_CSV_PRAKIRAAN = `tanggal,lokasi,jam_mulai,interval_jam,suhu,kelembapan,waktu_produksi
2026-10-24,Kec. Contoh,7,3,31,70,2026-10-24T05:00:00
2026-10-24,Kec. Contoh,10,3,34,58,2026-10-24T05:00:00
2026-10-24,Kec. Contoh,13,3,33,60,2026-10-24T05:00:00`

export const T_PRAKIRAAN: PrakiraanCuaca[] = [7, 10, 13].map((jamMulai, i) => ({
  tanggal: T_TANGGAL,
  lokasi: "Kec. Contoh",
  jamMulai,
  intervalJam: 3,
  suhu: [31, 34, 33][i],
  kelembapan: [70, 58, 60][i],
  waktuProduksi: "2026-10-24T05:00:00",
}))

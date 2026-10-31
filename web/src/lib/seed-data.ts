import { JAM_SHIFT } from "./config"
import type { AppState } from "./store-state"

export const DEMO_VERSION = "demo-v1"

/** Never merge a demo into an existing workspace, including measurement-only workspaces. */
export function bisaMuatDemo(s: AppState): boolean {
  return (!s.demo || s.demo.versi === "workspace-v3") && !(s.management?.workers.length || s.management?.shifts.length) && !s.rencanaDihitung && [s.pekerja, s.penugasan, s.kehadiran, s.konfirmasi,
    s.bacaan, s.prakiraan, s.rencana, s.tindakan, s.pengiriman, s.imporLog].every((rows) => rows.length === 0)
}

function offset(tanggal: string, hari: number) {
  const d = new Date(`${tanggal}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + hari)
  return d.toISOString().slice(0, 10)
}

/** Synthetic inputs, relative to the selected plan date. No real people or live weather. */
export function dataDemo(tanggal: string) {
  const d = new Date(`${tanggal}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== tanggal) {
    throw new Error("Tanggal seed tidak valid.")
  }
  const lama = offset(tanggal, -730)
  const pekerja = [
    "kode_pekerja,nama,regu,tanggal_mulai,tugas,zona,apd",
    `DEMO001,Andi (demo),COR,${tanggal},PEMBESIAN,GUDANG,Standar`,
    `DEMO002,Rudi (demo),COR,${lama},PENGECORAN,COR_B,Standar`,
    `DEMO003,Dedi (demo),COR,${lama},PEMBESIAN,GUDANG,Standar`,
    `DEMO004,Eko (demo),BEK,${lama},BEKISTING,BEK_A,Standar`,
    `DEMO005,Fajar (demo),BEK,${lama},PENGELASAN,GUDANG,Coverall tertutup`,
    `DEMO006,Gita (demo),BEK,${lama},ANGKUT,GUDANG,Standar`,
    `DEMO007,Hadi (demo),COR,${lama},ANGKUT,GUDANG,Standar`,
    `DEMO008,Nia (demo),BEK,${lama},PEMERIKSAAN,GUDANG,Standar`,
  ].join("\n")

  const kehadiran = ["kode_pekerja,tanggal,status"]
  for (let hari = -14; hari < 0; hari++) {
    const tgl = offset(tanggal, hari)
    for (const kode of ["DEMO002", "DEMO005", "DEMO006", "DEMO007", "DEMO008"]) {
      kehadiran.push(`${kode},${tgl},HADIR`)
    }
    kehadiran.push(`DEMO003,${tgl},${hari < -10 ? "HADIR" : "CUTI"}`)
    if (hari <= -7) kehadiran.push(`DEMO004,${tgl},HADIR`)
  }

  const pengukuran = ["zona,tanggal,jam_mulai,isbb,id_alat,pencatat,kalibrasi,jenis,waktu_catat"]
  const zona = [
    { kode: "COR_B", nilai: [27.2, 28.4, 29.6, 30.6, 31.8, 31.2, 30.1, 28.9] },
    { kode: "GUDANG", nilai: [25.8, 26.4, 27.0, 27.5, 27.9, 27.6, 27.1, 26.5] },
  ]
  for (const z of zona) {
    JAM_SHIFT.forEach((jam, i) => pengukuran.push(
      `${z.kode},${tanggal},${jam},${z.nilai[i]},DEMO-${z.kode},Simulasi,Bukan alat nyata,REPLAY,${tanggal}T${String(jam).padStart(2, "0")}:00:00`,
    ))
  }
  // BEK_A intentionally has no measurements: demonstrates the fail-safe path.
  const prakiraan = ["tanggal,lokasi,jam_mulai,interval_jam,suhu,kelembapan,waktu_produksi"]
  ;[7, 10, 13].forEach((jam, i) => prakiraan.push(
    `${tanggal},SIMULASI bukan data BMKG aktual,${jam},3,${[31, 34, 33][i]},${[70, 58, 60][i]},${tanggal}T05:00:00`,
  ))
  return { pekerja, kehadiran: kehadiran.join("\n"), pengukuran: pengukuran.join("\n"), prakiraan: prakiraan.join("\n") }
}

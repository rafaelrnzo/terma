// Mock rule engine for the frontend demo. Implements PRD Revisi 2 section 8:
// - action status and data quality are separate outputs
// - daily acclimatization limit and NAB interval limit are both checked, in explicit minutes,
//   and the adaptation % is never multiplied by the NAB row %
// - an empty NAB cell means "unsupported combination", never zero
// - forecast-only, stale or missing readings never produce a ready status
// - when several conditions apply, the most restrictive status wins
// No ML, no probability, no personal score.

import { AMBANG_USIA_BACAAN_MENIT, JAM_SHIFT, NORMAL_PAPARAN_MENIT, ZONA, awalInterval } from "./config"
import type {
  AcclProfile,
  ActionStatus,
  Aturan,
  DataQuality,
  IntervalPlan,
  Kehadiran,
  KonfirmasiPaparan,
  Pekerja,
  Penugasan,
  PengukuranWBGT,
  PrakiraanCuaca,
  Tugas,
  Workload,
} from "./types"

const STATUS_RANK: Record<ActionStatus, number> = {
  RENCANA_TERSEDIA: 0,
  ADAPTASI_DIPERLUKAN: 1,
  TINJAU_HSE: 2,
  BATASI_ATAU_PINDAHKAN: 3,
}

const QUALITY_RANK: Record<DataQuality, number> = {
  TERUKUR: 0,
  REPLAY: 1,
  PRAKIRAAN_SAJA: 2,
  KEDALUWARSA: 3,
  TIDAK_TERSEDIA: 4,
}

export const jam = (h: number) => `${String(h).padStart(2, "0")}.00`
export const rentangJam = (h: number) => `${jam(h)}–${jam(h + 1)}`
const fmt = (n: number) => n.toFixed(1).replace(".", ",")

/** NIOSH schedule (PRD F-ACCL-02). Day is 1-based and only advances on confirmed exposure. */
export function persenAdaptasi(profil: AcclProfile | "NORMAL", hari: number): number {
  if (profil === "NORMAL") return 100
  if (profil === "PEKERJA_BARU") return Math.min(100, 20 + 20 * (hari - 1))
  return [50, 60, 80, 100][hari - 1] ?? 100
}

export interface KandidatAdaptasi {
  pekerjaKode: string
  pemicu: "PEKERJA_BARU" | "KEMBALI_TANPA_PAPARAN" | "RIWAYAT_TIDAK_LENGKAP" | null
  hariTanpaHadir: number
  catatanKehadiran: number // records in the last 7 days
  saranProfil: AcclProfile | "NORMAL"
  keterangan: string
}

/**
 * Attendance is only a TRIGGER for review (F-ACCL-01). It never proves exposure; HSE confirms.
 */
export function deteksiKandidat(
  p: Pekerja,
  kehadiran: Kehadiran[],
  tanggalRencana: string,
): KandidatAdaptasi {
  const milik = kehadiran.filter((k) => k.pekerjaKode === p.kode).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  const plan = new Date(tanggalRencana + "T00:00:00Z")
  const tujuhHari: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(plan)
    d.setUTCDate(d.getUTCDate() - i)
    tujuhHari.push(d.toISOString().slice(0, 10))
  }
  const catatan7 = milik.filter((k) => tujuhHari.includes(k.tanggal)).length

  // consecutive days without HADIR, counting back from the day before the plan date
  let hariTanpaHadir = 0
  const hadirSet = new Set(milik.filter((k) => k.status === "HADIR").map((k) => k.tanggal))
  const adaSet = new Set(milik.map((k) => k.tanggal))
  for (let i = 1; i <= 30; i++) {
    const d = new Date(plan)
    d.setUTCDate(d.getUTCDate() - i)
    const s = d.toISOString().slice(0, 10)
    if (hadirSet.has(s)) break
    if (!adaSet.has(s)) break // unknown day: not counted as "absent", handled as incomplete history
    hariTanpaHadir++
  }

  const baru = p.tanggalMulai >= addDays(tanggalRencana, -14) && hadirSet.size === 0
  if (baru)
    return {
      pekerjaKode: p.kode,
      pemicu: "PEKERJA_BARU",
      hariTanpaHadir: 0,
      catatanKehadiran: catatan7,
      saranProfil: "PEKERJA_BARU",
      keterangan: `Mulai penugasan ${p.tanggalMulai}, belum ada riwayat hadir. Tanggal mulai saja tidak membuktikan adaptasi.`,
    }
  if (hariTanpaHadir >= 7)
    return {
      pekerjaKode: p.kode,
      pemicu: "KEMBALI_TANPA_PAPARAN",
      hariTanpaHadir,
      catatanKehadiran: catatan7,
      saranProfil: "BERPENGALAMAN_KEMBALI",
      keterangan: `${hariTanpaHadir} hari berturut-turut tidak hadir (cuti/sakit). Perlu konfirmasi profil; tidak otomatis normal.`,
    }
  if (catatan7 < 7)
    return {
      pekerjaKode: p.kode,
      pemicu: "RIWAYAT_TIDAK_LENGKAP",
      hariTanpaHadir,
      catatanKehadiran: catatan7,
      saranProfil: "NORMAL",
      keterangan: `Hanya ${catatan7} dari 7 hari terakhir punya catatan kehadiran. Riwayat tidak lengkap.`,
    }
  return {
    pekerjaKode: p.kode,
    pemicu: null,
    hariTanpaHadir,
    catatanKehadiran: catatan7,
    saranProfil: "NORMAL",
    keterangan: "Hadir 7 hari terakhir; tidak ada pemicu adaptasi.",
  }
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Age of a reading relative to the START of the interval it is used for. A reading taken more than
 * the HSE threshold before that interval (for example yesterday's, or an early-morning reading
 * reused for noon) is stale. A reading taken during the interval is fresh.
 */
export function usiaBacaanMenit(r: PengukuranWBGT): number {
  return Math.round((awalInterval(r.tanggal, r.jamMulai) - Date.parse(r.waktuCatat)) / 60000)
}

export function kualitasBacaan(
  zonaKode: string,
  tanggal: string,
  h: number,
  bacaan: PengukuranWBGT[],
  prakiraan: PrakiraanCuaca[],
): { kualitas: DataQuality; reading?: PengukuranWBGT } {
  const r = bacaan.find((b) => b.zonaKode === zonaKode && b.tanggal === tanggal && b.jamMulai === h)
  if (r) {
    if (usiaBacaanMenit(r) > AMBANG_USIA_BACAAN_MENIT) return { kualitas: "KEDALUWARSA", reading: r }
    return { kualitas: r.origin === "REPLAY" ? "REPLAY" : "TERUKUR", reading: r }
  }
  if (prakiraan.some((f) => f.tanggal === tanggal && h >= f.jamMulai && h < f.jamMulai + f.intervalJam)) return { kualitas: "PRAKIRAAN_SAJA" }
  return { kualitas: "TIDAK_TERSEDIA" }
}

/** Loosest allocation row whose NAB >= ISBB for this workload. Empty cells are skipped as unsupported. */
export function cariBaris(aturan: Aturan, beban: Workload, isbb: number) {
  const kosong: string[] = []
  for (const row of aturan.rows) {
    const nab = row.nab[beban]
    if (nab === undefined) {
      kosong.push(row.label)
      continue
    }
    if (nab >= isbb) return { row, kosong }
  }
  return { row: null, kosong }
}

export interface InputRencana {
  tanggal: string
  pekerja: Pekerja
  penugasan: Penugasan
  tugas: Tugas
  kandidat: KandidatAdaptasi
  konfirmasi?: KonfirmasiPaparan
  bacaan: PengukuranWBGT[]
  prakiraan: PrakiraanCuaca[]
  aturan: Aturan
}

export interface HasilRencana {
  status: ActionStatus
  kualitas: DataQuality
  belumLayak: boolean
  batasHarianMenit: number
  persenAdaptasi: number
  totalKerjaMenit: number
  intervals: IntervalPlan[]
  alasan: string[]
  usulan: string[]
}

export function hitungRencana(input: InputRencana): HasilRencana {
  const { tanggal, penugasan, tugas, kandidat, konfirmasi, bacaan, prakiraan, aturan } = input
  const statuses = new Set<ActionStatus>()
  const alasan: string[] = []
  const usulan: string[] = []
  let blokPaparan = false // no heat exposure allowed until HSE resolves an open review

  // 1. Acclimatization (daily limit). Attendance only triggers review; HSE confirmation decides.
  let persen = 100
  if (konfirmasi) {
    persen = persenAdaptasi(konfirmasi.profil, konfirmasi.hariAdaptasi)
    if (persen < 100) {
      statuses.add("ADAPTASI_DIPERLUKAN")
      const label = konfirmasi.profil === "PEKERJA_BARU" ? "pekerja baru" : "berpengalaman kembali"
      alasan.push(
        `Profil ${label}, hari adaptasi ke-${konfirmasi.hariAdaptasi} (dikonfirmasi ${konfirmasi.dikonfirmasiOleh}): maks ${persen}% × ${NORMAL_PAPARAN_MENIT} menit = ${Math.round((persen / 100) * NORMAL_PAPARAN_MENIT)} menit paparan hari ini (NIOSH).`,
      )
    } else if (kandidat.pemicu) {
      alasan.push(`Riwayat paparan ditinjau dan dikonfirmasi ${konfirmasi.dikonfirmasiOleh}: profil normal.`)
    }
  } else if (kandidat.pemicu) {
    statuses.add("TINJAU_HSE")
    blokPaparan = true
    persen = 0
    alasan.push(
      kandidat.pemicu === "RIWAYAT_TIDAK_LENGKAP"
        ? `${kandidat.keterangan} Riwayat tidak lengkap menghasilkan TINJAU HSE.`
        : `Kandidat adaptasi: ${kandidat.keterangan} Profil dan riwayat paparan belum dikonfirmasi HSE.`,
    )
  }

  // 2. PPE support (no arbitrary correction)
  if (!aturan.apdDidukung.includes(penugasan.apd)) {
    statuses.add("TINJAU_HSE")
    blokPaparan = true
    alasan.push(
      `APD "${penugasan.apd}" tidak didukung aturan ${aturan.versi}. Koreksi APD hanya dari acuan yang disetujui; tidak ditambah skor arbitrer.`,
    )
  }

  const batasHarian = blokPaparan ? 0 : Math.round((persen / 100) * NORMAL_PAPARAN_MENIT)

  // 3. Interval limits from NAB, per hour
  const blokir: number[] = []
  const tanpaUkur: number[] = []
  const kosongDicatat = new Set<string>()
  const intervals: IntervalPlan[] = JAM_SHIFT.map((h) => {
    const { kualitas, reading } = kualitasBacaan(penugasan.zonaKode, tanggal, h, bacaan, prakiraan)
    if (kualitas === "PRAKIRAAN_SAJA" || kualitas === "KEDALUWARSA" || kualitas === "TIDAK_TERSEDIA") {
      tanpaUkur.push(h)
      return {
        jamMulai: h,
        isbb: reading?.isbb ?? null,
        kualitas,
        barisNab: null,
        kerjaMaksMenit: 0,
        kerjaDirencanakan: 0,
        catatan:
          kualitas === "KEDALUWARSA"
            ? `Bacaan diambil ${reading ? usiaBacaanMenit(reading) : "?"} menit sebelum interval (ambang ${AMBANG_USIA_BACAAN_MENIT}). Perlu pengukuran baru.`
            : kualitas === "PRAKIRAAN_SAJA"
              ? "Hanya prakiraan BMKG (3 jam). Bukan pengukuran lokasi; perlu pengukuran."
              : "Tidak ada data. Perlu pengukuran.",
      }
    }
    const isbb = reading!.isbb
    const { row, kosong } = cariBaris(aturan, tugas.beban, isbb)
    kosong.forEach((k) => kosongDicatat.add(k))
    if (!row) {
      blokir.push(h)
      const nabMaks = aturan.rows[aturan.rows.length - 1].nab[tugas.beban]
      return {
        jamMulai: h,
        isbb,
        kualitas,
        barisNab: null,
        kerjaMaksMenit: 0,
        kerjaDirencanakan: 0,
        catatan: `ISBB ${fmt(isbb)}°C melewati NAB tertinggi (0–25%) ${nabMaks !== undefined ? fmt(nabMaks) + "°C" : "Belum tersedia"} untuk beban ${tugas.beban.toLowerCase()}: tidak ada alokasi.`,
      }
    }
    return {
      jamMulai: h,
      isbb,
      kualitas,
      barisNab: row.label,
      kerjaMaksMenit: row.kerjaMaksMenit,
      kerjaDirencanakan: 0,
      catatan: `NAB ${fmt(row.nab[tugas.beban]!)}°C ≥ ISBB ${fmt(isbb)}°C → baris ${row.label}, kerja maks ${row.kerjaMaksMenit} menit/jam.`,
    }
  })

  // 4. Daily limit and interval limits must BOTH hold. Allocate chronologically, never above either.
  let sisa = batasHarian
  for (const iv of intervals) {
    const alok = Math.min(iv.kerjaMaksMenit, sisa)
    iv.kerjaDirencanakan = alok
    sisa -= alok
  }
  const total = intervals.reduce((s, iv) => s + iv.kerjaDirencanakan, 0)

  if (kosongDicatat.size > 0)
    alasan.push(
      `Sel NAB kosong untuk beban ${tugas.beban.toLowerCase()} pada baris ${[...kosongDicatat].join(", ")}: kombinasi tidak didukung (bukan nol), baris itu dilewati.`,
    )

  if (tanpaUkur.length > 0) {
    statuses.add("TINJAU_HSE")
    alasan.push(
      `Jam ${tanpaUkur.map(rentangJam).join(", ")}: tidak ada bacaan WBGT yang valid di ${namaZona(penugasan.zonaKode)}. Tidak ada status siap dari prakiraan atau bacaan kedaluwarsa.`,
    )
    usulan.push(`Lakukan pengukuran WBGT di ${namaZona(penugasan.zonaKode)} sebelum menugaskan paparan panas.`)
  }

  if (blokir.length > 0) {
    statuses.add("BATASI_ATAU_PINDAHKAN")
    alasan.push(
      `Jam ${blokir.map(rentangJam).join(", ")}: tidak ada alokasi ${tugas.nama.toLowerCase()} (beban ${tugas.beban.toLowerCase()}) yang memenuhi ${aturan.versi}.`,
    )
    for (const h of blokir) {
      const alternatif = ZONA.filter((z) => z.kode !== penugasan.zonaKode)
        .map((z) => {
          const { kualitas, reading } = kualitasBacaan(z.kode, tanggal, h, bacaan, prakiraan)
          if (!reading || (kualitas !== "TERUKUR" && kualitas !== "REPLAY")) return null
          const { row } = cariBaris(aturan, tugas.beban, reading.isbb)
          return row ? `${z.nama} (ISBB ${fmt(reading.isbb)}°C, baris ${row.label})` : null
        })
        .filter(Boolean)
      if (alternatif.length > 0) usulan.push(`${rentangJam(h)}: pindahkan ke ${alternatif.join(" / ")} setelah ditinjau HSE.`)
    }
    usulan.push("Atau pindahkan waktu ke slot yang memenuhi batas, atau pilih tugas lain yang telah dinilai.")
  }

  if (batasHarian > 0 && batasHarian < NORMAL_PAPARAN_MENIT)
    alasan.push(
      `Batas harian ${batasHarian} menit dan batas interval NAB diperiksa bersamaan. Persentase adaptasi tidak dikalikan dengan persentase baris NAB. Rencana: ${total} menit.`,
    )
  if (total < NORMAL_PAPARAN_MENIT)
    alasan.push("Sisa shift berisi istirahat atau tugas lain yang kondisi panasnya telah dinilai; tidak dianggap otomatis aman.")

  if (alasan.length === 0) alasan.push(`Semua interval memenuhi ${aturan.versi} dengan bacaan yang valid.`)

  const status = [...statuses].sort((a, b) => STATUS_RANK[b] - STATUS_RANK[a])[0] ?? "RENCANA_TERSEDIA"
  const kualitas = intervals.map((i) => i.kualitas).sort((a, b) => QUALITY_RANK[b] - QUALITY_RANK[a])[0]

  return {
    status,
    kualitas,
    belumLayak: blokir.length > 0 || (batasHarian > 0 && total === 0),
    batasHarianMenit: batasHarian,
    persenAdaptasi: persen,
    totalKerjaMenit: total,
    intervals,
    alasan,
    usulan,
  }
}

export function namaZona(kode: string) {
  return ZONA.find((z) => z.kode === kode)?.nama ?? kode
}

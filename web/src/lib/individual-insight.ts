import { ATURAN_FIXTURE, TUGAS, ZONA } from "./config"
import { hitungRencana } from "./rules"
import { kandidatUntuk, type AppState } from "./store"
import type { IntervalPlan, Pekerja, Rencana } from "./types"

export type InsightLevel = "BELUM_ADA" | "DATA_KURANG" | "BATASI" | "ADAPTASI" | "PANTAU"

export interface IndividualInsight {
  level: InsightLevel
  headline: string
  summary: string
  validIntervals: number
  missingIntervals: number
  blockedIntervals: number
  peakIsbb: number | null
  plannedMinutes: number
  actions: string[]
  reasons: string[]
  intervals: IntervalPlan[]
}

const isMeasured = (interval: IntervalPlan) => interval.kualitas === "TERUKUR" || interval.kualitas === "REPLAY"

/**
 * Preview of exposure signals from an existing, versioned plan. This does not estimate illness
 * probability or infer a worker's medical condition. Unknown measurements stay unknown.
 */
export function individualInsight(plan?: Rencana): IndividualInsight {
  if (!plan) return {
    level: "BELUM_ADA",
    headline: "Belum ada rencana untuk ditinjau",
    summary: "Hitung rencana pada tanggal ini sebelum melihat sinyal paparan pekerja.",
    validIntervals: 0,
    missingIntervals: 0,
    blockedIntervals: 0,
    peakIsbb: null,
    plannedMinutes: 0,
    actions: ["Lengkapi penugasan dan pengukuran WBGT, lalu hitung rencana bersama HSE."],
    reasons: [],
    intervals: [],
  }

  const valid = plan.intervals.filter(isMeasured)
  const missing = plan.intervals.filter(interval => !isMeasured(interval))
  const blocked = valid.filter(interval => interval.barisNab === null)
  const peakIsbb = valid.length ? Math.max(...valid.map(interval => interval.isbb!).filter(Number.isFinite)) : null
  const needsReview = plan.status === "TINJAU_HSE" || missing.length > 0

  let level: InsightLevel
  let headline: string
  let summary: string
  if (blocked.length > 0 || plan.status === "BATASI_ATAU_PINDAHKAN") {
    level = "BATASI"
    headline = "Ada interval yang perlu dibatasi"
    summary = `${blocked.length} interval dengan bacaan tidak memiliki alokasi kerja pada aturan yang dipakai.${missing.length ? ` ${missing.length} interval lain belum memiliki bacaan valid.` : ""} HSE perlu meninjau perubahan tugas, lokasi, atau waktu.`
  } else if (missing.length > 0 || valid.length === 0) {
    level = "DATA_KURANG"
    headline = "Perkiraan belum dapat dilengkapi"
    summary = `${missing.length} dari ${plan.intervals.length} interval belum memiliki bacaan WBGT valid. Tidak ada kesimpulan kesehatan dari celah data ini.`
  } else if (needsReview) {
    level = "DATA_KURANG"
    headline = "Perlu peninjauan HSE"
    summary = "Rencana memerlukan pemeriksaan HSE sebelum paparan panas dilakukan. Lihat alasan dan sumber data di bawah."
  } else if (plan.status === "ADAPTASI_DIPERLUKAN") {
    level = "ADAPTASI"
    headline = "Adaptasi perlu dipantau"
    summary = `Rencana membatasi paparan menjadi ${plan.totalKerjaMenit} menit hari ini. Pengawasan lapangan tetap diperlukan selama adaptasi.`
  } else {
    level = "PANTAU"
    headline = "Pantau selama shift"
    summary = "Rencana memiliki bacaan untuk setiap interval. Kondisi pekerja tetap perlu dipantau; status rencana bukan pernyataan sehat."
  }

  const actions = [...plan.usulan]
  if (missing.length > 0 && !actions.some(action => action.includes("pengukuran WBGT"))) {
    actions.unshift("Ukur ulang WBGT pada interval yang belum memiliki bacaan valid sebelum paparan panas.")
  }
  if (plan.status === "ADAPTASI_DIPERLUKAN") {
    actions.push("Pastikan mandor memantau pekerja yang sedang adaptasi dan melaporkan keluhan panas kepada HSE.")
  }
  actions.push("Konfirmasi kondisi pekerja secara langsung; jika muncul gejala terkait panas, ikuti prosedur tanggap darurat lokasi.")

  return {
    level,
    headline,
    summary,
    validIntervals: valid.length,
    missingIntervals: missing.length,
    blockedIntervals: blocked.length,
    peakIsbb,
    plannedMinutes: plan.totalKerjaMenit,
    actions,
    reasons: plan.alasan,
    intervals: plan.intervals,
  }
}

/** Read-only comparison: never writes to the saved plan or changes an approval. */
export function simulateZone(state: AppState, worker: Pekerja, zoneCode: string) {
  const assignment = state.penugasan.find(item => item.pekerjaKode === worker.kode)
  const task = TUGAS.find(item => item.kode === assignment?.tugasKode)
  if (!assignment || !task || !ZONA.some(zone => zone.kode === zoneCode) || zoneCode === assignment.zonaKode) return null
  const result = hitungRencana({
    tanggal: state.tanggal,
    pekerja: worker,
    penugasan: { ...assignment, zonaKode: zoneCode },
    tugas: task,
    kandidat: kandidatUntuk(state, worker),
    konfirmasi: state.konfirmasi.find(item => item.pekerjaKode === worker.kode),
    bacaan: state.bacaan,
    prakiraan: state.prakiraan,
    aturan: ATURAN_FIXTURE,
  })
  return {
    status: result.status,
    plannedMinutes: result.totalKerjaMenit,
    missingIntervals: result.intervals.filter(interval => !isMeasured(interval)).length,
    blockedIntervals: result.intervals.filter(interval => isMeasured(interval) && interval.barisNab === null).length,
  }
}

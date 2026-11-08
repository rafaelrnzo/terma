import { currentShift, managementOf } from "./management-state"
import { audit, notice, now, tanggalValid } from "./store-utils"
import { recompute } from "./store-plans"
import { hariIni } from "./config"
import { isCheckinMethod, type CheckinMethod } from "./kiosk-entry"
import type { AppState } from "./store-state"

export const BODY_COMPLAINTS = ["Pusing", "Lemas", "Mual", "Sakit kepala", "Kram otot", "Keluhan lain", "Demam", "Diare/muntah", "Kurang tidur", "Lain"] as const
export type BodyComplaint = typeof BODY_COMPLAINTS[number]
export type BodyCondition = "BAIK" | "KURANG_BUGAR" | "ADA_KELUHAN"
export type WorkHealthStatus = "TANPA_PEMBATASAN" | "DENGAN_PEMBATASAN" | "PERLU_TINJAU"
export interface HealthBaseline {
  pekerjaKode: string
  tanggalPemeriksaan: string
  berlakuSampai: string
  status: WorkHealthStatus
  pembatasan: string
  sumber: string
  dicatatOleh: string
  dicatatPada: string
}
export type BaselineInput = Omit<HealthBaseline, "dicatatOleh" | "dicatatPada">
export interface WorkerCheckin {
  pekerjaKode: string
  kondisi: BodyCondition
  metode?: CheckinMethod
  persetujuan?: boolean
  keluhan: BodyComplaint[]
  waktu: string
  pulang?: string // check-out time: hours on site for the heat dose, and overtime
}
export interface ReadinessReview {
  pekerjaKode: string
  hasil: "LANJUT_TINJAU_RENCANA" | "TUNDA_PENUGASAN"
  catatan: string
  oleh: string
  waktu: string
}
export interface ShiftReadiness { checkins: WorkerCheckin[]; baselines: HealthBaseline[]; reviews: ReadinessReview[] }
export type ReadinessAction =
  | { type: "CATAT_CHECKIN"; pekerjaKode: string; kondisi: BodyCondition; keluhan: BodyComplaint[]; metode?: CheckinMethod; persetujuan?: boolean }
  | { type: "TINJAU_KONDISI"; pekerjaKode: string; hasil: ReadinessReview["hasil"]; catatan: string }
  | { type: "CATAT_PULANG"; pekerjaKode: string }
  | { type: "SIMPAN_BASELINE"; input: BaselineInput }

export function readinessProgress(state: AppState) {
  const shift = currentShift(state)
  if (!shift?.readiness) return { required: false, total: state.pekerja.length, checked: 0, reviewed: 0, ready: true }
  const codes = new Set(state.pekerja.map(worker => worker.kode))
  const checked = shift.readiness.checkins.filter(checkin => codes.has(checkin.pekerjaKode)).length
  const reviewed = shift.readiness.reviews.filter(review => codes.has(review.pekerjaKode) && review.hasil === "LANJUT_TINJAU_RENCANA").length
  return { required: true, total: codes.size, checked, reviewed, ready: codes.size > 0 && checked === codes.size && reviewed === codes.size }
}

export function saveBaseline(state: AppState, input: BaselineInput): AppState {
  const management = managementOf(state)
  if (!management.workers.some(worker => worker.kode === input.pekerjaKode)) return notice(state, "error", "Pekerja tidak ditemukan.")
  if (!tanggalValid(input.tanggalPemeriksaan) || !tanggalValid(input.berlakuSampai) || input.berlakuSampai < input.tanggalPemeriksaan || input.tanggalPemeriksaan > hariIni()) return notice(state, "error", "Periksa tanggal pemeriksaan dan masa berlaku dokumen.")
  if (!["TANPA_PEMBATASAN", "DENGAN_PEMBATASAN", "PERLU_TINJAU"].includes(input.status) || input.sumber.trim().length < 3 || input.pembatasan.length > 1000 || (input.status !== "TANPA_PEMBATASAN" && input.pembatasan.trim().length < 5)) return notice(state, "error", "Isi sumber dokumen dan pembatasan atau arahan tindak lanjut.")
  const previous = management.healthBaselines?.find(row => row.pekerjaKode === input.pekerjaKode)
  if (previous && previous.tanggalPemeriksaan === input.tanggalPemeriksaan && previous.berlakuSampai === input.berlakuSampai && previous.status === input.status && previous.pembatasan === input.pembatasan.trim() && previous.sumber === input.sumber.trim()) return notice(state, "info", "Baseline sudah tersimpan; tidak ada perubahan data.")
  const baseline: HealthBaseline = { ...input, sumber: input.sumber.trim(), pembatasan: input.pembatasan.trim(), dicatatOleh: state.sesi?.userId ?? "", dicatatPada: now() }
  const healthBaselines = [...(management.healthBaselines ?? []).filter(row => row.pekerjaKode !== input.pekerjaKode), baseline]
  const active = currentShift(state)
  const mayRefresh = active?.status === "DRAFT" && !state.rencana.some(plan => plan.disetujuiOleh)
  const shifts = management.shifts.map(shift => shift.id === active?.id && mayRefresh && shift.readiness && shift.workspace.pekerja.some(worker => worker.kode === input.pekerjaKode) ? { ...shift, readiness: { ...shift.readiness, baselines: [...shift.readiness.baselines.filter(row => row.pekerjaKode !== input.pekerjaKode), baseline], reviews: shift.readiness.reviews.filter(row => row.pekerjaKode !== input.pekerjaKode) } } : shift)
  return notice(audit({ ...state, management: { ...management, healthBaselines, shifts } }, "BASELINE_KESEHATAN", `${input.pekerjaKode}: ringkasan dokumen diperbarui; snapshot aktif/tertutup dipertahankan.`), "ok", "Baseline tersimpan. Shift berjalan dan riwayat tertutup tetap memakai salinan sebelumnya.")
}

export function recordReadiness(state: AppState, action: Exclude<ReadinessAction, { type: "SIMPAN_BASELINE" }>): AppState {
  const shift = currentShift(state)
  if (!shift?.readiness || shift.status === "CLOSED") return notice(state, "error", "Check-in hanya dapat dicatat pada shift yang belum ditutup.")
  if (action.type === "CATAT_CHECKIN" && shift.tanggal > hariIni()) return notice(state, "error", "Absen belum dibuka untuk tanggal shift yang akan datang.")
  const worker = state.pekerja.find(row => row.kode === action.pekerjaKode)
  if (!worker) return notice(state, "error", "ID pekerja tidak terdaftar pada shift ini.")
  const readiness = shift.readiness
  if (action.type === "CATAT_PULANG") {
    const checkin = readiness.checkins.find(row => row.pekerjaKode === worker.kode)
    if (!checkin) return notice(state, "error", "Pekerja belum absen masuk pada shift ini.")
    if (checkin.pulang) return notice(state, "info", "Absen pulang sudah tercatat.")
    const management = managementOf(state)
    const checkins = readiness.checkins.map(row => row.pekerjaKode === worker.kode ? { ...row, pulang: now() } : row)
    const next = { ...state, management: { ...management, shifts: management.shifts.map(row => row.id === shift.id ? { ...row, readiness: { ...readiness, checkins } } : row) } }
    return notice(audit(next, "ABSEN_PULANG", `${worker.kode}: absen pulang tercatat.`, worker.kode), "ok", `Absen pulang ${worker.nama} tercatat. Terima kasih.`)
  }
  if (action.type === "CATAT_CHECKIN") {
    const consented = managementOf(state).shifts.some(row => row.readiness?.checkins.some(checkin => checkin.pekerjaKode === worker.kode && checkin.persetujuan === true))
    if (shift.calculationVersion === "PDF_V0" && !consented && action.persetujuan !== true) return notice(state, "error", "Persetujuan penggunaan jawaban kondisi diperlukan pada check-in pertama.")
    if (action.metode !== undefined && !isCheckinMethod(action.metode)) return notice(state, "error", "Metode absen tidak dikenal.")
    if (!["BAIK", "KURANG_BUGAR", "ADA_KELUHAN"].includes(action.kondisi) || !Array.isArray(action.keluhan) || action.keluhan.some(complaint => !BODY_COMPLAINTS.includes(complaint)) || new Set(action.keluhan).size !== action.keluhan.length || (action.kondisi === "BAIK" && action.keluhan.length > 0) || (action.kondisi === "ADA_KELUHAN" && !action.keluhan.length)) return notice(state, "error", "Pilih kondisi tubuh dan keluhan dengan benar.")
    const previous = readiness.checkins.find(row => row.pekerjaKode === worker.kode)
    if (previous?.kondisi === action.kondisi && previous.keluhan.join("|") === action.keluhan.join("|")) return notice(state, "info", "Absen Anda sudah tercatat. Tidak ada catatan ganda.")
    const checkin: WorkerCheckin = { pekerjaKode: worker.kode, kondisi: action.kondisi, keluhan: [...action.keluhan], metode: action.metode, persetujuan: consented || action.persetujuan === true, waktu: now() }
    const updated = { ...readiness, checkins: [...readiness.checkins.filter(row => row.pekerjaKode !== worker.kode), checkin], reviews: readiness.reviews.filter(row => row.pekerjaKode !== worker.kode) }
    const kehadiran = [...state.kehadiran.filter(row => row.pekerjaKode !== worker.kode || row.tanggal !== shift.tanggal), { pekerjaKode: worker.kode, tanggal: shift.tanggal, status: "HADIR" as const, source: "Check-in kondisi awal pekerja" }]
    const management = managementOf(state)
    const next = { ...state, kehadiran, management: { ...management, shifts: management.shifts.map(row => row.id === shift.id ? { ...row, readiness: updated } : row) } }
    return notice(audit(recompute(next), "CHECKIN_PEKERJA", `${worker.kode}: kehadiran dan kondisi awal tercatat.`, worker.kode), "ok", "Absen dan kondisi awal tersimpan. Ikuti instruksi mandor. Jawaban kondisi hanya tersedia untuk Klinik.")
  }
  if (!readiness.checkins.some(row => row.pekerjaKode === worker.kode)) return notice(state, "error", "Pekerja perlu absen dan mengisi kondisi tubuh terlebih dahulu.")
  if (!["LANJUT_TINJAU_RENCANA", "TUNDA_PENUGASAN"].includes(action.hasil) || action.catatan.trim().length < 5 || action.catatan.length > 1000) return notice(state, "error", "Catat tindak lanjut HSE minimal lima karakter.")
  const review: ReadinessReview = { pekerjaKode: worker.kode, hasil: action.hasil, catatan: action.catatan.trim(), oleh: state.sesi?.userId ?? "", waktu: now() }
  const management = managementOf(state)
  return notice(audit({ ...state, management: { ...management, shifts: management.shifts.map(row => row.id === shift.id ? { ...row, readiness: { ...readiness, reviews: [...readiness.reviews.filter(item => item.pekerjaKode !== worker.kode), review] } } : row) } }, "TINJAU_KONDISI", `${worker.kode}: tindak lanjut kondisi awal dicatat.`), "ok", "Tinjauan HSE tersimpan.")
}

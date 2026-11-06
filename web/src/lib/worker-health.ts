import { lingkupPekerja } from "./access"
import type { ManagementState, ShiftRecord } from "./management-types"
import type { User } from "./types"
import type { HealthBaseline, ReadinessReview, WorkerCheckin } from "./worker-readiness"

export const MONITORING_STATUS = {
  DITUNDA: "Penugasan ditunda",
  PERLU_TINJAU: "Perlu tinjauan HSE",
  DATA_KURANG: "Data belum lengkap",
  DITINJAU: "Rencana disetujui",
} as const
export type MonitoringStatus = keyof typeof MONITORING_STATUS
export const CONDITION_LABEL = { BAIK: "Merasa baik", KURANG_BUGAR: "Kurang bugar", ADA_KELUHAN: "Ada keluhan" } as const
export const BASELINE_LABEL = { TANPA_PEMBATASAN: "Tanpa pembatasan pada dokumen", DENGAN_PEMBATASAN: "Ada pembatasan kerja", PERLU_TINJAU: "Perlu tindak lanjut" } as const
export type BaselineValidity = "BELUM_ADA" | "BELUM_BERLAKU" | "KEDALUWARSA" | "BERLAKU"
export const BASELINE_VALIDITY_LABEL: Record<BaselineValidity, string> = {
  BELUM_ADA: "Belum ada dokumen", BELUM_BERLAKU: "Belum berlaku", KEDALUWARSA: "Dokumen kedaluwarsa", BERLAKU: "Dokumen berlaku",
}

export interface HealthEvidence {
  baseline?: HealthBaseline
  checkin?: WorkerCheckin
  review?: ReadinessReview
}

export function baselineValidity(baseline: HealthBaseline | undefined, date: string): BaselineValidity {
  if (!baseline) return "BELUM_ADA"
  if (baseline.tanggalPemeriksaan > date) return "BELUM_BERLAKU"
  return baseline.berlakuSampai < date ? "KEDALUWARSA" : "BERLAKU"
}

function evidenceFor(management: ManagementState, code: string, shift?: ShiftRecord): HealthEvidence {
  // A dated shift owns its evidence. Never fill a historical gap with today's master data.
  return {
    baseline: (shift ? shift.readiness?.baselines : management.healthBaselines)?.find(row => row.pekerjaKode === code),
    checkin: shift?.readiness?.checkins.find(row => row.pekerjaKode === code),
    review: shift?.readiness?.reviews.find(row => row.pekerjaKode === code),
  }
}

/** Read projection: only Clinic receives condition answers and review notes; HSE receives work summaries. */
export function workerHealthRows(management: ManagementState, user: User, date: string) {
  const shifts = management.shifts.filter(shift => shift.tanggal === date)
  return lingkupPekerja(user, management.workers).map(worker => {
    const shift = shifts.find(row => row.workspace.pekerja.some(person => person.kode === worker.kode))
    const evidence = evidenceFor(management, worker.kode, shift)
    return {
      worker,
      assignment: management.assignments.find(row => row.pekerjaKode === worker.kode),
      shift: shift ? { id: shift.id, nama: shift.nama, tanggal: shift.tanggal } : undefined,
      status: evidence.review?.hasil === "TUNDA_PENUGASAN" ? "DITUNDA" as const : baselineValidity(evidence.baseline, date) !== "BERLAKU" ? "DATA_KURANG" as const : shift?.workspace.rencana.some(plan => plan.pekerjaKode === worker.kode && !plan.digantikan && plan.disetujuiOleh) ? "DITINJAU" as const : "PERLU_TINJAU" as const,
      validity: baselineValidity(evidence.baseline, date),
      checkedIn: !!evidence.checkin,
      reviewed: !!evidence.review || !!shift?.workspace.rencana.some(plan=>plan.pekerjaKode===worker.kode && !plan.digantikan && plan.disetujuiOleh),
      health: user.role === "KLINIK" ? evidence : user.role === "HSE" ? { baseline: evidence.baseline } : undefined,
    }
  })
}
export type WorkerHealthRow = ReturnType<typeof workerHealthRows>[number]

export function workerHealthHistory(management: ManagementState, user: User, code: string) {
  if (!["HSE", "KLINIK"].includes(user.role) || !lingkupPekerja(user, management.workers).some(worker => worker.kode === code)) return []
  return management.shifts.filter(shift => shift.workspace.pekerja.some(worker => worker.kode === code))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .map(shift => { const evidence = evidenceFor(management, code, shift); return { id: shift.id, nama: shift.nama, tanggal: shift.tanggal, checkedIn: !!evidence.checkin, approved: shift.workspace.rencana.some(plan=>plan.pekerjaKode===code && !plan.digantikan && plan.disetujuiOleh), baseline: evidence.baseline, checkin: user.role === "KLINIK" ? evidence.checkin : undefined, review: user.role === "KLINIK" ? evidence.review : undefined } })
}

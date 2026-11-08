import { validAlertAction } from "./shift-alerts"
import { validPlacement } from "./station-placement"
import { validPersonalEvent } from "./personal-telemetry"
import type { AppState } from "./store-state"
import type { ManagementState, ShiftWorkspace } from "./management-types"
import { tanggalValid } from "./store-utils"
import type { HealthBaseline, ShiftReadiness } from "./worker-readiness"
import { isCheckinMethod } from "./kiosk-entry"
import { BODY_COMPLAINTS } from "./worker-readiness"

function objects(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(item => item && typeof item === "object" && !Array.isArray(item))
}
function workspace(value: ShiftWorkspace) {
  return value && typeof value.rencanaDihitung === "boolean" && [value.pekerja, value.penugasan, value.kehadiran, value.konfirmasi, value.bacaan, value.prakiraan, value.rencana, value.tindakan, value.pengiriman].every(objects)
}
function baselines(value: HealthBaseline[]) {
  return objects(value) && new Set(value.map(row => row.pekerjaKode)).size === value.length && value.every(row => typeof row.pekerjaKode === "string" && tanggalValid(row.tanggalPemeriksaan) && tanggalValid(row.berlakuSampai) && row.berlakuSampai >= row.tanggalPemeriksaan && ["TANPA_PEMBATASAN", "DENGAN_PEMBATASAN", "PERLU_TINJAU"].includes(row.status) && typeof row.pembatasan === "string" && typeof row.sumber === "string" && typeof row.dicatatOleh === "string" && Number.isFinite(Date.parse(row.dicatatPada)))
}
function readiness(value: ShiftReadiness) {
  return value && baselines(value.baselines) && objects(value.checkins) && objects(value.reviews) &&
    new Set(value.checkins.map(row => row.pekerjaKode)).size === value.checkins.length && new Set(value.reviews.map(row => row.pekerjaKode)).size === value.reviews.length &&
    value.checkins.every(row => (row.pulang === undefined || Number.isFinite(Date.parse(row.pulang))) && (row.metode === undefined || isCheckinMethod(row.metode)) && (row.persetujuan === undefined || typeof row.persetujuan === "boolean") && typeof row.pekerjaKode === "string" && ["BAIK", "KURANG_BUGAR", "ADA_KELUHAN"].includes(row.kondisi) && Array.isArray(row.keluhan) && row.keluhan.every(complaint => BODY_COMPLAINTS.includes(complaint)) && Number.isFinite(Date.parse(row.waktu))) &&
    value.reviews.every(row => typeof row.pekerjaKode === "string" && ["LANJUT_TINJAU_RENCANA", "TUNDA_PENUGASAN"].includes(row.hasil) && typeof row.catatan === "string" && typeof row.oleh === "string" && Number.isFinite(Date.parse(row.waktu)))
}
/** Reject incomplete snapshots before the provider can overwrite a recoverable saved workspace. */
export function validateManagement(state: AppState) {
  const m: ManagementState | undefined = state.management
  if (!m) return
  if (m.clinic !== undefined) {
    const clinic = m.clinic
    if (!clinic || !objects(clinic.consents) || !objects(clinic.profiles) || !objects(clinic.followups) ||
      clinic.consents.some(row=>typeof row.pekerjaKode !== "string" || !["MCU","OBAT","BAND"].includes(row.jenis) || typeof row.aktif !== "boolean" || !Number.isFinite(Date.parse(row.waktu))) ||
      clinic.profiles.some(row=>typeof row.pekerjaKode !== "string" || typeof row.catatan !== "string" || [row.hipertensi,row.diabetes,row.jantung,row.riwayatPanas,row.obatBerisiko].some(flag=>typeof flag !== "boolean") || !Number.isFinite(Date.parse(row.waktu))) ||
      clinic.followups.some(row=>typeof row.pekerjaKode !== "string" || !tanggalValid(row.tanggal) || !["PANGGIL","DIPERIKSA","BATASI"].includes(row.status) || typeof row.catatan !== "string" || !Number.isFinite(Date.parse(row.waktu)))) throw new Error("Invalid clinic records")
  }
  if (!objects(m.workers) || !objects(m.assignments) || !objects(m.shifts)) throw new Error("Invalid management collections")
  if (m.companySync !== undefined && (!m.companySync || !["LOCAL_ADAPTER", "WORKSPACE"].includes(m.companySync.source) || !Number.isFinite(Date.parse(m.companySync.syncedAt)))) throw new Error("Invalid company connection")
  if (m.healthBaselines !== undefined && !baselines(m.healthBaselines)) throw new Error("Invalid health baselines")
  if (m.shifts.some(shift => shift.alertActions !== undefined && (!Array.isArray(shift.alertActions) || !shift.alertActions.every(validAlertAction)))) throw new Error("Invalid alert actions")
  if (m.stationPlacements !== undefined && (!Array.isArray(m.stationPlacements) || !m.stationPlacements.every(validPlacement))) throw new Error("Invalid station placements")
  if (m.shifts.some(shift => shift.personalTelemetry !== undefined && (!Array.isArray(shift.personalTelemetry) || shift.personalTelemetry.some(row=>!validPersonalEvent(row))))) throw new Error("Invalid personal telemetry")
  if (m.shifts.some(shift => shift.bands !== undefined && (!objects(shift.bands) || shift.bands.some(row=>typeof row.id !== "string" || typeof row.bandId !== "string" || typeof row.pekerjaKode !== "string" || !Number.isFinite(Date.parse(row.ditugaskanPada)))))) throw new Error("Invalid Band allocations")
  if (m.shifts.some(shift => shift.readiness !== undefined && !readiness(shift.readiness))) throw new Error("Invalid shift readiness")
  if (new Set(m.workers.map(worker => worker.kode)).size !== m.workers.length || m.workers.some(worker => typeof worker.kode !== "string" || typeof worker.nama !== "string" || !tanggalValid(worker.tanggalMulai))) throw new Error("Invalid workers")
  if (new Set(m.shifts.map(shift => shift.id)).size !== m.shifts.length || m.shifts.some(shift => !tanggalValid(shift.tanggal) || shift.id !== shift.tanggal || typeof shift.nama !== "string" || !["DRAFT", "ACTIVE", "CLOSED"].includes(shift.status) || !workspace(shift.workspace))) throw new Error("Invalid shift snapshots")
  if (m.activeId !== null && (!m.shifts.some(shift => shift.id === m.activeId) || m.activeId !== state.tanggal)) throw new Error("Invalid active shift")
}

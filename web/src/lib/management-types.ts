import type { PersonalDeviceEvent } from "./personal-telemetry"
import type { BandAllocation } from "./band-management"
import type { ClinicState } from "./clinic"
import type { CompanySync } from "./company-data"
import type { AppState } from "./store-state"
import type { Pekerja, Penugasan } from "./types"
import type { HealthBaseline, ShiftReadiness } from "./worker-readiness"

export type ShiftWorkspace = Pick<AppState, "pekerja" | "penugasan" | "kehadiran" | "konfirmasi" | "bacaan" | "prakiraan" | "rencana" | "rencanaDihitung" | "tindakan" | "pengiriman">
export interface ShiftRecord {
  id: string
  tanggal: string
  nama: string
  status: "DRAFT" | "ACTIVE" | "CLOSED"
  dibuatOleh: string
  dibuatPada: string
  diterbitkanPada?: string
  ditutupPada?: string
  ditutupOleh?: string
  calculationVersion?: "PDF_V0"
  contoh?: boolean
  personalTelemetry?: PersonalDeviceEvent[]
  bands?: BandAllocation[]
  readiness?: ShiftReadiness
  workspace: ShiftWorkspace
}
export interface ManagementState {
  workers: Pekerja[]
  assignments: Penugasan[]
  shifts: ShiftRecord[]
  activeId: string | null
  healthBaselines?: HealthBaseline[]
  clinic?: ClinicState
  companySync?: CompanySync
}
export interface WorkerInput {
  kode: string
  nama: string
  reguKode: string
  tanggalMulai: string
  tugasKode: string
  zonaKode: string
  apd: string
}
export type ManagementAction =
  | { type: "SIMPAN_PEKERJA"; input: WorkerInput; previousCode?: string; expectedRevision?: number }
  | { type: "HAPUS_PEKERJA"; kode: string; expectedRevision: number }
  | { type: "ARSIP_PEKERJA"; kode: string; archived: boolean; expectedRevision: number }
  | { type: "BUAT_SHIFT"; tanggal: string; nama: string; workerCodes: string[] }
  | { type: "UBAH_SHIFT"; shiftId: string; nama: string; workerCodes: string[] }
  | { type: "HAPUS_SHIFT"; shiftId: string }
  | { type: "BUKA_SHIFT"; shiftId: string }
  | { type: "TERBITKAN_SHIFT"; shiftId: string }
  | { type: "TUTUP_SHIFT"; shiftId: string }

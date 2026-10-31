import type { AppState } from "./store-state"
import type { Pekerja, Penugasan } from "./types"

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
  contoh?: boolean
  workspace: ShiftWorkspace
}
export interface ManagementState {
  workers: Pekerja[]
  assignments: Penugasan[]
  shifts: ShiftRecord[]
  activeId: string | null
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

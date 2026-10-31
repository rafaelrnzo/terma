import { hariIni } from "./config"
import type { ManagementAction, ManagementState } from "./management-types"
import type { AcclProfile, AuditEntry, ImportResult, Kehadiran, KonfirmasiPaparan, Pekerja, Penugasan, Pengiriman, PengukuranWBGT, PrakiraanCuaca, Rencana, Tindakan } from "./types"

export interface AppState {
  management?: ManagementState
  demo?: { versi: string; tanggal: string }
  sesi: { userId: string; masuk: string } | null
  tanggal: string // plan date
  pekerja: Pekerja[]
  kehadiran: Kehadiran[]
  penugasan: Penugasan[]
  konfirmasi: KonfirmasiPaparan[]
  bacaan: PengukuranWBGT[]
  prakiraan: PrakiraanCuaca[]
  rencana: Rencana[]
  rencanaDihitung: boolean
  tindakan: Tindakan[]
  pengiriman: Pengiriman[]
  imporLog: ImportResult[]
  audit: AuditEntry[]
  notice?: { id: number; tipe: "ok" | "error" | "info"; pesan: string }
}

/** The app opens as the site HSE officer; switching user happens in the header. */
export const PENGGUNA_AWAL = "hse-ratna"

export function stateAwal(tanggal = hariIni()): AppState {
  return {
    sesi: { userId: PENGGUNA_AWAL, masuk: new Date().toISOString() },
    tanggal,
    pekerja: [],
    kehadiran: [],
    penugasan: [],
    konfirmasi: [],
    bacaan: [],
    prakiraan: [],
    rencana: [],
    rencanaDihitung: false,
    tindakan: [],
    pengiriman: [],
    imporLog: [],
    audit: [],
  }
}

export type Action =
  | ManagementAction
  | { type: "MUAT_DEMO" }
  | { type: "LOGIN"; userId: string }
  | { type: "SET_TANGGAL"; tanggal: string }
  | { type: "IMPOR_PEKERJA"; csv: string; source: string }
  | { type: "IMPOR_KEHADIRAN"; csv: string; source: string }
  | { type: "IMPOR_PENGUKURAN"; csv: string; source: string }
  | { type: "IMPOR_PRAKIRAAN"; csv: string; source: string }
  | { type: "KONFIRMASI"; pekerjaKode: string; profil: AcclProfile | "NORMAL"; hari: number }
  | { type: "INPUT_BACAAN"; zonaKode: string; jamMulai: number; isbb: number; idAlat: string; kalibrasi: string }
  | { type: "AMBIL_BACAAN_PERANGKAT" }
  | { type: "HITUNG_RENCANA" }
  | { type: "SETUJUI"; rencanaId: string }
  | { type: "UBAH_PENUGASAN"; pekerjaKode: string; zonaKode: string; tugasKode: string }
  | { type: "BAGIKAN"; reguKode: string; kanal: string }
  | { type: "TANDAI_GAGAL"; pengirimanId: string; alasan: string }
  | { type: "AKUI"; pengirimanId: string }
  | { type: "LAPOR"; tindakanId: string; dijalankan: boolean; pelaksana: string; waktu: string; menit: number; alasan?: string }
  | { type: "VERIFIKASI"; tindakanId: string; hasil: "TERVERIFIKASI" | "BELUM_SELESAI"; menit: number }
  | { type: "HYDRATE"; state: AppState }

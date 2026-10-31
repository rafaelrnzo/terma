// Domain types. Mirrors /db/schema.sql and PRD Revisi 2 section 8.

export type ActionStatus =
  | "RENCANA_TERSEDIA"
  | "ADAPTASI_DIPERLUKAN"
  | "TINJAU_HSE"
  | "BATASI_ATAU_PINDAHKAN"

export type DataQuality =
  | "TERUKUR"
  | "REPLAY"
  | "PRAKIRAAN_SAJA"
  | "KEDALUWARSA"
  | "TIDAK_TERSEDIA"

export type DataOrigin = "AKTUAL" | "SINTETIS" | "MANUAL" | "REPLAY"

export type ActionLifecycle =
  | "DIBUAT"
  | "DISAMPAIKAN"
  | "DIAKUI"
  | "TINDAKAN_DILAPORKAN"
  | "TERVERIFIKASI"
  | "BELUM_SELESAI"

export type AcclProfile = "PEKERJA_BARU" | "BERPENGALAMAN_KEMBALI"
export type Workload = "RINGAN" | "SEDANG" | "BERAT" | "SANGAT_BERAT"
export type Role = "HSE" | "MANDOR" | "PETUGAS_DATA"
export type AttendanceStatus = "HADIR" | "CUTI" | "SAKIT" | "ALFA"
/** No messaging integration yet: a shared message is DIBAGIKAN_MANUAL, never TERKIRIM without channel proof. */
export type DeliveryStatus = "DIBAGIKAN_MANUAL" | "TERKIRIM" | "GAGAL"

export interface User {
  id: string
  username: string
  nama: string
  role: Role
  reguKode?: string // mandor only
}

export interface Regu {
  kode: string
  nama: string
  mandorId: string
}

export interface Zona {
  kode: string
  nama: string
}

export interface Tugas {
  kode: string
  nama: string
  beban: Workload
}

export interface Pekerja {
  kode: string
  nama: string
  reguKode: string
  tanggalMulai: string // ISO date
  source: string
  origin: DataOrigin
  revision?: number
  diarsipkan?: boolean
}

export interface Kehadiran {
  pekerjaKode: string
  tanggal: string
  status: AttendanceStatus
  source: string
}

export interface Penugasan {
  pekerjaKode: string
  tugasKode: string
  zonaKode: string
  apd: string
  apdBerubah: boolean // trigger for re-assessment
  version: number
}

/** HSE confirmation of exposure history / acclimatization profile (F-ACCL-01/02). */
export interface KonfirmasiPaparan {
  pekerjaKode: string
  profil: AcclProfile | "NORMAL"
  hariAdaptasi: number // 1-based, advances only on confirmed exposure + HSE review
  dikonfirmasiOleh: string
  waktu: string
}

/** One hourly WBGT reading for a zone (F-ENV-02). */
export interface PengukuranWBGT {
  zonaKode: string
  tanggal: string // ISO date of the interval
  jamMulai: number // 8..15
  isbb: number // °C
  idAlat: string
  pencatat: string
  kalibrasi: string
  origin: DataOrigin // REPLAY for labelled recordings
  waktuCatat: string // ISO timestamp the reading was taken
}

/** BMKG forecast, kept at its native 3-hour interval (F-ENV-01). */
export interface PrakiraanCuaca {
  tanggal: string
  lokasi: string
  jamMulai: number
  intervalJam: number
  suhu: number
  kelembapan: number
  waktuProduksi: string
}

export interface NabRow {
  label: string // "75–100%"
  kerjaMaksMenit: number // upper bound of allocation per hour
  nab: Partial<Record<Workload, number>> // missing key = unsupported combination
}

export interface Aturan {
  kode: string
  versi: string
  sumber: string
  isFixture: boolean
  apdDidukung: string[]
  rows: NabRow[]
}

export interface IntervalPlan {
  jamMulai: number
  isbb: number | null
  kualitas: DataQuality
  barisNab: string | null // matched allocation row
  kerjaMaksMenit: number // interval limit (NAB)
  kerjaDirencanakan: number // after applying daily limit
  catatan: string
}

export interface Rencana {
  id: string // `${pekerjaKode}-v${version}@${tanggal}`
  tanggal: string
  pekerjaKode: string
  version: number
  status: ActionStatus
  kualitas: DataQuality
  belumLayak: boolean // F-PLAN-02: RENCANA BELUM LAYAK
  batasHarianMenit: number
  persenAdaptasi: number
  totalKerjaMenit: number
  intervals: IntervalPlan[]
  alasan: string[]
  usulan: string[]
  aturanVersi: string
  dibuat: string
  disetujuiOleh?: string
  waktuPersetujuan?: string
  digantikan?: boolean // superseded by a newer version
  sig: string // hash of inputs+outputs, used to detect changes on recompute
  zonaKode: string
  tugasKode: string
}

export interface Tindakan {
  id: string
  rencanaId: string
  reguKode: string
  pekerjaKode: string
  deskripsi: string
  status: ActionLifecycle
  menitDirencanakan: number // planned heat-exposure minutes (from Rencana)
  menitDilaporkan?: number // reported by the foreman
  menitDiverifikasi?: number // verified by HSE; reports never turn planned data into actual data
  pelaksana?: string
  waktuTindakan?: string
  dijalankan?: boolean
  alasanTidakDijalankan?: string
  pemeriksa?: string
  waktuVerifikasi?: string
}

export interface Pengiriman {
  id: string
  reguKode: string
  isi: string
  status: DeliveryStatus
  waktu: string
  buktiKanal?: string
  diakui: boolean
}

export interface ImportRowResult {
  baris: number
  data: string
  ok: boolean
  alasan?: string
}

export interface ImportResult {
  jenis: "pekerja" | "kehadiran" | "pengukuran" | "prakiraan"
  waktu: string
  diterima: number
  baru: number
  sudahAda: number
  ditolak: ImportRowResult[]
}

export interface AuditEntry {
  waktu: string
  aktor: string
  aksi: string
  detail: string
}

import { currentShift } from "./management-state"
import { lingkupPekerja } from "./access"
import { pageAllowedFor } from "./navigation"
import { workflow } from "./workflow"
import type { AppState } from "./store"
import type { User } from "./types"

export const SURFACES = [
  { href: "/absensi", label: "Absensi & kondisi awal", detail: "Cakupan kehadiran; jawaban kondisi tubuh hanya untuk Klinik" },
  { href: "/impor?tab=pemeriksaan", label: "Baseline kesehatan perusahaan", detail: "Ringkasan pemeriksaan dan pembatasan kerja untuk ditinjau HSE" },
  { href: "/forecasting", label: "Forecasting · peta prakiraan", detail: "Prakiraan cuaca, suhu dan kelembapan per periode untuk persiapan shift" },
  { href: "/monitoring", label: "Monitoring shift", detail: "Peta WBGT per zona, kualitas bacaan, dan progres pelaksanaan regu" },
  { href: "/monitoring?tab=analitik", label: "Analitik shift", detail: "Grafik kondisi panas, adaptasi, dan ringkasan data shift terpilih" },
  { href: "/perangkat", label: "Perangkat IoT", detail: "TERMA Station, smart water station RFID, TERMA Band BLE" },
  { href: "/laporan/bulanan", label: "Rekap bulanan", detail: "Akumulasi durasi terverifikasi per pekerja" },
  { href: "/", label: "Tentang TERMA", detail: "Pengantar aplikasi dan alur HSE–mandor" },
  { href: "/ringkasan", label: "Shift kerja", detail: "Buat draft, pilih peserta, lanjutkan shift, dan lihat hasil penutupan" },
  { href: "/impor", label: "Data pekerja", detail: "Tambah, edit, hapus, dan arsipkan pekerja serta penugasan awal" },
  { href: "/rencana?tab=adaptasi", label: "Adaptasi pekerja", detail: "Riwayat kehadiran dan konfirmasi HSE" },
  { href: "/pengukuran", label: "Pengukuran WBGT", detail: "Bacaan panas per zona dan jam" },
  { href: "/rencana", label: "Rencana kerja", detail: "Batas paparan, penugasan, dan persetujuan" },
  { href: "/instruksi", label: "Instruksi mandor", detail: "Pembagian dan penerimaan rencana per regu" },
  { href: "/tindakan", label: "Tindakan & verifikasi", detail: "Pelaksanaan, laporan mandor, dan pemeriksaan HSE" },
  { href: "/laporan", label: "Laporan & audit", detail: "Rekap shift dan jejak aktivitas" },
]

export const STEP_OUTCOMES: Record<string, string> = {
  "/impor": "Identitas, penugasan, dan kehadiran siap ditinjau.",
  "/paparan": "Profil adaptasi dikonfirmasi untuk perhitungan rencana.",
  "/pengukuran": "Sumber bacaan per zona dan interval dapat ditelusuri.",
  "/rencana": "Versi rencana disetujui HSE sebelum dibagikan.",
  "/instruksi": "Mandor mengakui penerimaan versi rencana yang tepat.",
  "/tindakan": "Durasi aktual dilaporkan mandor dan diperiksa HSE.",
  "/laporan": "Rekap administratif beserta kekosongan datanya.",
}

export function searchWorkspace(s: AppState, user: User, query: string) {
  const terms = query.toLocaleLowerCase("id-ID").trim().split(/\s+/).filter(Boolean)
  const matches = (text: string) => terms.every(t => text.toLocaleLowerCase("id-ID").includes(t))
  return [
    ...SURFACES.filter(p => pageAllowedFor(user,p.href.split("?")[0]) && matches(p.label + " " + p.detail)).map(p => ({ ...p, kind: "Halaman" })),
    ...lingkupPekerja(user, s.pekerja).filter(p => matches(`${p.nama} ${p.kode} ${p.reguKode}`)).map(p => ({ href: `/pekerja/${p.kode}`, label: p.nama, detail: `${p.kode} · Regu ${p.reguKode}`, kind: "Pekerja" })),
  ]
}

export function attentionItems(s: AppState, user: User) {
  return workflow(s, user).filter(step => step.no !== "7" && !step.selesai && step.peran.includes(user.role))
}

export function tanggalLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z"))
}

/** Read scope for summary/detail surfaces; the original shared demo is never mutated. */
export function scopedWorkspace(workspace: AppState, user: User): AppState {
  const shift = currentShift(workspace)
  const participantIds = shift ? new Set(shift.workspace.pekerja.map(worker=>worker.kode)) : null
  const s = shift && participantIds ? {
    ...workspace, pekerja: shift.workspace.pekerja,
    penugasan: workspace.penugasan.filter(row=>participantIds.has(row.pekerjaKode)),
    kehadiran: workspace.kehadiran.filter(row=>participantIds.has(row.pekerjaKode)),
    konfirmasi: workspace.konfirmasi.filter(row=>participantIds.has(row.pekerjaKode)),
    rencana: workspace.rencana.filter(row=>participantIds.has(row.pekerjaKode)),
    tindakan: workspace.tindakan.filter(row=>participantIds.has(row.pekerjaKode)),
  } : workspace
  if (user.role !== "MANDOR") return s
  const pekerja = lingkupPekerja(user, s.pekerja)
  const ids = new Set(pekerja.map(p => p.kode))
  return {
    ...s, pekerja,
    kehadiran: s.kehadiran.filter(x => ids.has(x.pekerjaKode)),
    penugasan: s.penugasan.filter(x => ids.has(x.pekerjaKode)),
    konfirmasi: s.konfirmasi.filter(x => ids.has(x.pekerjaKode)),
    rencana: s.rencana.filter(x => ids.has(x.pekerjaKode)),
    tindakan: s.tindakan.filter(x => ids.has(x.pekerjaKode)),
    pengiriman: s.pengiriman.filter(x => x.reguKode === user.reguKode),
    // Import/audit records can contain cross-crew details; their complete view belongs to HSE/data roles.
    imporLog: [], audit: [],
  }
}

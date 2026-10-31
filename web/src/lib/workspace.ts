import { lingkupPekerja } from "./access"
import { workflow } from "./workflow"
import type { AppState } from "./store"
import type { User } from "./types"

export const SURFACES = [
  { href: "/perangkat", label: "Perangkat IoT", detail: "TERMA Station, smart water station RFID, TERMA Band BLE" },
  { href: "/kesehatan", label: "Paparan & rujukan klinik", detail: "Akumulasi paparan terverifikasi, kesiapan rujukan pemeriksaan ginjal" },
  { href: "/", label: "Tentang TERMA", detail: "Pengantar aplikasi dan alur HSE–mandor" },
  { href: "/ringkasan", label: "Dashboard", detail: "Hari ini: ringkasan pekerjaan, peta zona, kondisi panas, dan prioritas shift" },
  { href: "/impor", label: "Pekerja & data", detail: "Direktori pekerja, penugasan, dan impor CSV" },
  { href: "/paparan", label: "Adaptasi pekerja", detail: "Riwayat kehadiran dan konfirmasi HSE" },
  { href: "/pengukuran", label: "Pengukuran WBGT", detail: "Bacaan panas per zona dan jam" },
  { href: "/rencana", label: "Rencana kerja", detail: "Batas paparan, penugasan, dan persetujuan" },
  { href: "/insight", label: "Insight kesehatan individu", detail: "Sinyal paparan per pekerja, kualitas bacaan, dan tinjauan HSE" },
  { href: "/instruksi", label: "Instruksi mandor", detail: "Pembagian dan penerimaan rencana per regu" },
  { href: "/tindakan", label: "Tindakan & verifikasi", detail: "Pelaksanaan, laporan mandor, dan pemeriksaan HSE" },
  { href: "/laporan", label: "Laporan & audit", detail: "Rekap shift dan jejak aktivitas" },
  { href: "/panduan", label: "Panduan alur shift", detail: "Empat tahap, tanggung jawab peran, serah terima dan panduan interaktif" },
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
    ...SURFACES.filter(p => matches(p.label + " " + p.detail)).map(p => ({ ...p, kind: "Halaman" })),
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
export function scopedWorkspace(s: AppState, user: User): AppState {
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

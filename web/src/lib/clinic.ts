import type { AppState } from "./store-state"
import { currentShift, managementOf } from "./management-state"
import { audit, notice, now, tanggalValid } from "./store-utils"
import { recompute } from "./store-plans"
import type { User } from "./types"

export const CONSENT_KINDS = ["MCU", "OBAT", "BAND"] as const
export type ConsentKind = typeof CONSENT_KINDS[number]
export interface WorkerConsent { pekerjaKode: string; jenis: ConsentKind; aktif: boolean; waktu: string; oleh: string }
export interface MedicalProfile {
  pekerjaKode: string
  tanggalLahir?: string
  tinggiCm?: number
  beratKg?: number
  hipertensi: boolean
  diabetes: boolean
  jantung: boolean
  riwayatPanas: boolean
  obatBerisiko: boolean
  catatan: string
  waktu: string
}
export interface ClinicFollowup { pekerjaKode: string; tanggal: string; status: "PANGGIL" | "DIPERIKSA" | "BATASI"; catatan: string; waktu: string; oleh: string }
export interface ClinicState { consents: WorkerConsent[]; profiles: MedicalProfile[]; followups: ClinicFollowup[] }
export type ClinicAction =
  | { type: "AKSES_PROFIL_MEDIS"; pekerjaKode: string }
  | { type: "PERSETUJUAN_MEDIS"; pekerjaKode: string; jenis: ConsentKind; aktif: boolean }
  | { type: "SIMPAN_PROFIL_MEDIS"; input: Omit<MedicalProfile, "waktu"> }
  | { type: "TINDAK_LANJUT_KLINIK"; pekerjaKode: string; status: ClinicFollowup["status"]; catatan: string }

export function clinicOf(s: AppState): ClinicState { return managementOf(s).clinic ?? { consents: [], profiles: [], followups: [] } }
export function hasConsent(s: AppState, code: string, kind: ConsentKind) { return clinicOf(s).consents.some(row => row.pekerjaKode === code && row.jenis === kind && row.aktif) }
export function medicalProfileFor(s: AppState, user: User, code: string) {
  if (user.role !== "KLINIK" || !hasConsent(s, code, "MCU")) return undefined
  const profile = clinicOf(s).profiles.find(row => row.pekerjaKode === code)
  return profile ? { ...profile, obatBerisiko: hasConsent(s, code, "OBAT") && profile.obatBerisiko } : undefined
}
/** Only derived, consent-gated points enter the planning engine. No raw clinical values leave here. */
export function medicalRiskPoints(s: AppState, code: string) {
  if (!hasConsent(s, code, "MCU")) return { points: 0, available: false }
  const profile = clinicOf(s).profiles.find(row => row.pekerjaKode === code)
  if (!profile) return { points: 0, available: false }
  let points = Math.min(2, Number(profile.hipertensi) + Number(profile.diabetes) + Number(profile.jantung)) + (profile.riwayatPanas ? 2 : 0)
  if (profile.tinggiCm && profile.beratKg && profile.beratKg / (profile.tinggiCm / 100) ** 2 >= 30) points++
  if (profile.tanggalLahir && Number(s.tanggal.slice(0,4)) - Number(profile.tanggalLahir.slice(0,4)) - (s.tanggal.slice(5) < profile.tanggalLahir.slice(5) ? 1 : 0) >= 60) points++
  if (hasConsent(s, code, "OBAT") && profile.obatBerisiko) points++
  return { points, available: true }
}
export function clinicInbox(s: AppState, user: User, date: string) {
  if (user.role !== "KLINIK") return []
  const m = managementOf(s)
  return m.shifts.filter(shift => shift.tanggal === date).flatMap(shift => (shift.readiness?.checkins ?? [])
    .filter(checkin => checkin.kondisi !== "BAIK")
    .map(checkin => ({ checkin, worker: shift.workspace.pekerja.find(row => row.kode === checkin.pekerjaKode), shiftId: shift.id,
      followup: clinicOf(s).followups.find(row => row.pekerjaKode === checkin.pekerjaKode && row.tanggal === date) })))
}
export function manageClinic(s: AppState, action: ClinicAction): AppState {
  const m = managementOf(s), clinic = clinicOf(s)
  if (s.sesi?.userId === undefined) return notice(s, "error", "Pilih akun Klinik.")
  const code = action.type === "SIMPAN_PROFIL_MEDIS" ? action.input.pekerjaKode : action.pekerjaKode
  if (!m.workers.some(worker => worker.kode === code)) return notice(s, "error", "Pekerja tidak ditemukan.")
  if (action.type === "AKSES_PROFIL_MEDIS") return audit(s, "AKSES_PROFIL_MEDIS", `${code}: profil Klinik ${hasConsent(s,code,"MCU") ? "dibuka dengan persetujuan aktif" : "ditahan tanpa persetujuan aktif"}.`)
  let next = clinic
  if (action.type === "PERSETUJUAN_MEDIS") {
    if (!CONSENT_KINDS.includes(action.jenis)) return notice(s, "error", "Jenis persetujuan tidak tersedia.")
    const consent: WorkerConsent = { pekerjaKode: code, jenis: action.jenis, aktif: action.aktif, waktu: now(), oleh: s.sesi.userId }
    next = { ...clinic, consents: [...clinic.consents.filter(row => !(row.pekerjaKode === code && row.jenis === action.jenis)), consent] }
  } else if (action.type === "SIMPAN_PROFIL_MEDIS") {
    if (!hasConsent(s, code, "MCU")) return notice(s, "error", "Persetujuan MCU aktif diperlukan. Nilai medis tidak disimpan.")
    const p = action.input
    if ((p.tinggiCm !== undefined && (!Number.isFinite(p.tinggiCm) || p.tinggiCm < 50 || p.tinggiCm > 250)) || (p.beratKg !== undefined && (!Number.isFinite(p.beratKg) || p.beratKg < 20 || p.beratKg > 350)) || p.catatan.length > 1000 || (p.obatBerisiko && !hasConsent(s, code, "OBAT"))) return notice(s, "error", "Periksa tinggi, berat, catatan, dan persetujuan obat.")
    if ([p.hipertensi,p.diabetes,p.jantung,p.riwayatPanas,p.obatBerisiko].some(value => typeof value !== "boolean")) return notice(s, "error", "Flag kondisi harus diisi petugas Klinik.")
    if (p.tanggalLahir && (!tanggalValid(p.tanggalLahir) || p.tanggalLahir > s.tanggal)) return notice(s, "error", "Tanggal lahir tidak valid.")
    next = { ...clinic, profiles: [...clinic.profiles.filter(row => row.pekerjaKode !== code), { ...p, waktu: now() }] }
  } else {
    if (!["PANGGIL","DIPERIKSA","BATASI"].includes(action.status) || action.catatan.trim().length < 5 || action.catatan.length > 1000) return notice(s, "error", "Isi tindak lanjut Klinik dan catatan minimal lima karakter.")
    if (currentShift(s)?.status === "CLOSED") return notice(s, "error", "Shift tertutup tidak dapat diubah.")
    next = { ...clinic, followups: [...clinic.followups.filter(row => !(row.pekerjaKode === code && row.tanggal === s.tanggal)), { pekerjaKode: code, tanggal: s.tanggal, status: action.status, catatan: action.catatan.trim(), waktu: now(), oleh: s.sesi.userId }] }
  }
  const updated = audit({ ...s, management: { ...m, clinic: next } }, action.type, `${code}: catatan Klinik diperbarui; rincian dibatasi menurut peran.`)
  return notice(currentShift(s)?.status !== "CLOSED" ? recompute(updated) : updated, "ok", "Catatan Klinik tersimpan. Perubahan rencana ditinjau HSE tanpa rincian medis.")
}

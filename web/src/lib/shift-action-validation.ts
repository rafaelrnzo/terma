import { JAM_SHIFT, TUGAS, ZONA } from "./config"
import type { AppState, Action } from "./store-state"

export function shiftActionError(s: AppState, a: Action): string {
  if (!s.management) return ""
  if (a.type === "INPUT_BACAAN" && (!ZONA.some(zone => zone.kode === a.zonaKode) || !JAM_SHIFT.includes(a.jamMulai) || !Number.isFinite(a.isbb) || a.isbb < 0 || a.isbb > 60 || !a.idAlat.trim())) return "Isi zona, interval, identitas alat, dan WBGT antara 0–60 °C."
  if (a.type === "KONFIRMASI" && (!Number.isInteger(a.hari) || a.hari < 1 || a.hari > 5 || !["NORMAL", "PEKERJA_BARU", "BERPENGALAMAN_KEMBALI"].includes(a.profil))) return "Profil dan hari adaptasi tidak valid."
  if ((a.type === "KONFIRMASI" || a.type === "UBAH_PENUGASAN") && !s.pekerja.some(worker => worker.kode === a.pekerjaKode)) return "Pekerja bukan peserta shift yang sedang dibuka."
  if (a.type === "UBAH_PENUGASAN" && (!ZONA.some(zone => zone.kode === a.zonaKode) || !TUGAS.some(task => task.kode === a.tugasKode))) return "Zona atau tugas tidak tersedia."
  if (a.type === "SETUJUI" && !s.rencana.some(plan => plan.id === a.rencanaId && plan.tanggal === s.tanggal && !plan.digantikan)) return "Rencana bukan versi aktif pada shift ini."
  if ((a.type === "LAPOR" || a.type === "VERIFIKASI") && (!Number.isFinite(a.menit) || a.menit < 0 || a.menit > 480)) return "Durasi harus antara 0–480 menit."
  if (a.type === "LAPOR" && (!a.pelaksana.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(a.waktu))) return "Isi nama pelaksana dan waktu tindakan yang valid."
  return ""
}

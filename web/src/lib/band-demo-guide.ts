import { bodyMonitoring } from "./body-monitoring"
import { hasConsent } from "./clinic"
import { hariIni } from "./config"
import { managementOf } from "./management-state"
import type { AppState } from "./store-state"
import type { User } from "./types"

export function bandDemoGuide(state: AppState, user: User, now = Date.now()) {
  const management = managementOf(state)
  const code = "RAYA001"
  const shift = management.shifts.find(row => row.id === management.activeId && row.workspace.pekerja.some(worker => worker.kode === code))
    ?? management.shifts.find(row => row.tanggal === hariIni() && row.workspace.pekerja.some(worker => worker.kode === code) && row.status !== "CLOSED")
  const date = shift?.tanggal ?? hariIni()
  const consent = hasConsent(state, code, "BAND")
  const allocation = shift?.bands?.find(row => row.bandId === "BAND-01" && row.pekerjaKode === code && !row.dikembalikanPada && !row.dibatalkanPada)
  const signal = bodyMonitoring(state, user, code, date, now)?.signals.find(row => row.key === "band")
  const actual = shift?.personalTelemetry?.some(event => event.type === "BAND_READING" && event.pekerjaKode === code && event.deviceId === "BAND-01" && event.origin === "AKTUAL" && Date.parse(event.observedAt) <= now && now - Date.parse(event.observedAt) <= 5 * 60000)
  return [
    { id: "shift", title: "Buka Shift Raya", complete: !!shift && shift.status !== "CLOSED" && management.activeId === shift.id,
      description: "Buka shift yang memuat RAYA001. Semua langkah memakai akun Admin.", href: shift && shift.status !== "CLOSED" ? `/shift/${encodeURIComponent(shift.id)}` : "/pengelola", action: "Buka shift" },
    { id: "consent", title: "Catat persetujuan Band", complete: consent,
      description: "Di baris Raya, pilih Catat persetujuan Band setelah pekerja menyetujui pemantauan.", href: `/impor?tanggal=${date}`, action: "Buka Data pekerja" },
    { id: "assignment", title: "Tetapkan BAND-01 ke Raya", complete: !!allocation,
      description: "Pada kolom TERMA Band di baris Raya, pilih BAND-01 lalu Tetapkan.", href: `/impor?tanggal=${date}`, action: "Tetapkan unit Band" },
    { id: "publication", title: "Terbitkan shift", complete: shift?.status === "ACTIVE",
      description: "Lengkapi data dan adaptasi yang diminta, tinjau serta setujui rencana, lalu terbitkan shift.", href: "/rencana", action: "Buka Perencanaan shift" },
    { id: "wearing", title: "Catat Band sudah dipakai", complete: !!allocation?.dipakaiPada,
      description: "Di Dashboard admin, bagian Serah-terima TERMA Band, klik Sudah dipakai untuk Raya.", href: "/pengelola#band-handoff-title", action: "Buka serah-terima" },
    { id: "reading", title: "Lihat bacaan Raya", complete: !!actual && !!signal && signal.tone !== "unknown",
      description: "Nyalakan hotspot, tempelkan sensor denyut dengan stabil sekitar 30 detik. Bacaan baru setelah serah-terima akan masuk ke profil ini.", href: `/pemantauan/${code}?tanggal=${date}`, action: "Buka pemantauan Raya" },
  ]
}

import { lingkupPekerja } from "./access"
import { drinkLog } from "./drink-monitor"
import { currentShift, managementOf } from "./management-state"
import { rencanaAktif } from "./store-plans"
import { audit, notice, userById } from "./store-utils"
import type { AppState } from "./store-state"
import type { User } from "./types"

/** Foreman alerts during the shift (one of each kind per worker per 30 minutes, until handled). */
export const ALERT_RESPONSES = {
  ISTIRAHAT: "Istirahat di tempat teduh",
  PINDAH_ZONA: "Pindah ke zona lebih sejuk",
  KLINIK: "Diantar ke Klinik",
  MINUM: "Diminta minum",
  CEK_BAND: "Band diperiksa / dipasang ulang",
} as const
export type AlertResponse = keyof typeof ALERT_RESPONSES
export type AlertKind = "BAND_MERAH" | "BAND_WASPADA" | "MINUM" | "BAND_SENYAP"
export interface AlertAction { key: string; pekerjaKode: string; kind: AlertKind; tindakan: AlertResponse; oleh: string; waktu: string }
export type ShiftAlertAction = { type: "TANGANI_PERINGATAN"; key: string; pekerjaKode: string; kind: AlertKind; tindakan: AlertResponse }
export interface ShiftAlert { key: string; kind: AlertKind; level: "MERAH" | "KUNING" | "INFO"; pekerjaKode: string; nama: string; reguKode: string; pesan: string; responses: AlertResponse[] }

const WINDOW_MS = 30 * 60_000
const BAND_SILENT_MS = 5 * 60_000
const KINDS: AlertKind[] = ["BAND_MERAH", "BAND_WASPADA", "MINUM", "BAND_SENYAP"]

export function shiftAlerts(s: AppState, user: User, now = Date.now()): ShiftAlert[] {
  const shift = currentShift(s)
  if (!shift || shift.status === "CLOSED") return []
  const plans = rencanaAktif(s)
  const handled = new Set((shift.alertActions ?? []).map(row => row.key))
  const window = Math.floor(now / WINDOW_MS)
  const alerts: ShiftAlert[] = []
  for (const worker of lingkupPekerja(user, shift.workspace.pekerja)) {
    const add = (kind: AlertKind, level: ShiftAlert["level"], pesan: string, responses: AlertResponse[]) =>
      alerts.push({ key: `${kind}:${worker.kode}:${window}`, kind, level, pekerjaKode: worker.kode, nama: worker.nama, reguKode: worker.reguKode, pesan, responses })
    const band = plans.find(plan => plan.pekerjaKode === worker.kode)?.peringatanBand
    if (band === "MERAH") add("BAND_MERAH", "MERAH", "Band: suhu tubuh di batas aman. Hentikan kerja, istirahatkan di tempat teduh, beri minum, dan hubungi Klinik.", ["ISTIRAHAT", "KLINIK"])
    else if (band === "WASPADA") add("BAND_WASPADA", "KUNING", "Band mendekati ambang. Istirahatkan di tempat teduh 15 menit.", ["ISTIRAHAT", "PINDAH_ZONA"])
    const drink = drinkLog(shift, worker.kode, now)
    if (drink.overdue) add("MINUM", "KUNING", `Belum minum ${drink.gapMinutes} menit di Water Station.`, ["MINUM"])
    const worn = shift.bands?.find(row => row.pekerjaKode === worker.kode && row.dipakaiPada && !row.dikembalikanPada && !row.dibatalkanPada)
    if (worn?.dipakaiPada) {
      const lastReading = (shift.personalTelemetry ?? []).filter(event => event.type === "BAND_READING" && event.pekerjaKode === worker.kode).map(event => Date.parse(event.observedAt)).reduce((max, time) => Math.max(max, time), 0)
      const silent = now - Math.max(lastReading, Date.parse(worn.dipakaiPada))
      if (silent > BAND_SILENT_MS) add("BAND_SENYAP", "INFO", `${worn.bandId} tidak mengirim ${Math.floor(silent / 60_000)} menit. Periksa pemasangan dan baterai Band.`, ["CEK_BAND"])
    }
  }
  const rank = { MERAH: 0, KUNING: 1, INFO: 2 }
  return alerts.filter(alert => !handled.has(alert.key)).toSorted((a, b) => rank[a.level] - rank[b.level])
}

export function validAlertAction(row: AlertAction) {
  return !!row && typeof row.key === "string" && typeof row.pekerjaKode === "string" && KINDS.includes(row.kind) && row.tindakan in ALERT_RESPONSES && typeof row.oleh === "string" && Number.isFinite(Date.parse(row.waktu))
}

export function handleAlert(s: AppState, a: ShiftAlertAction): AppState {
  const user = userById(s.sesi?.userId)
  const shift = currentShift(s)
  if (!user || !shift || shift.status === "CLOSED") return notice(s, "error", "Peringatan hanya ditangani pada shift yang belum ditutup.")
  const worker = shift.workspace.pekerja.find(row => row.kode === a.pekerjaKode)
  if (!worker || !["ADMIN", "HSE", "MANDOR"].includes(user.role) || (user.role === "MANDOR" && worker.reguKode !== user.reguKode)) return notice(s, "error", "Peringatan ini bukan untuk regu Anda.")
  if (!KINDS.includes(a.kind) || !(a.tindakan in ALERT_RESPONSES) || !a.key.startsWith(`${a.kind}:${a.pekerjaKode}:`)) return notice(s, "error", "Tindakan peringatan tidak valid.")
  if (shift.alertActions?.some(row => row.key === a.key)) return notice(s, "info", "Peringatan ini sudah ditangani.")
  const row: AlertAction = { key: a.key, pekerjaKode: a.pekerjaKode, kind: a.kind, tindakan: a.tindakan, oleh: user.nama, waktu: new Date().toISOString() }
  const m = managementOf(s)
  const next = { ...s, management: { ...m, shifts: m.shifts.map(item => item.id === shift.id ? { ...item, alertActions: [...(item.alertActions ?? []), row] } : item) } }
  return notice(audit(next, "PERINGATAN_DITANGANI", `${worker.nama}: ${ALERT_RESPONSES[a.tindakan]} (${a.kind}).`), "ok", `${worker.nama}: ${ALERT_RESPONSES[a.tindakan]} tercatat.`)
}

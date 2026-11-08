import { currentShift, managementOf } from "./management-state"
import { hasConsent } from "./clinic"
import { audit, notice } from "./store-utils"
import type { AppState } from "./store-state"

interface DeviceEventBase { id: string; pekerjaKode: string; deviceId: string; observedAt: string; origin: "AKTUAL" | "REPLAY" }
export type PersonalDeviceEvent = DeviceEventBase & (
  | { type: "WATER_VISIT" }
  | { type: "WATER_COVERAGE"; coverageFrom: string; online: boolean }
  | { type: "BAND_READING"; heartRate: number; skinTemperature: number; quality: "VALID" | "LOW_SIGNAL"; batteryPercent?: number; activityG?: number }
)
export type PersonalTelemetryAction = { type: "TERIMA_TELEMETRI_PEKERJA"; events: PersonalDeviceEvent[] }

export function validPersonalEvent(row: PersonalDeviceEvent) {
  if (!row || typeof row.id !== "string" || !row.id.trim() || typeof row.pekerjaKode !== "string" || !row.pekerjaKode.trim() || typeof row.deviceId !== "string" || !row.deviceId.trim() || typeof row.observedAt !== "string" || !Number.isFinite(Date.parse(row.observedAt)) || !["AKTUAL","REPLAY"].includes(row.origin)) return false
  if (row.type === "WATER_VISIT") return true
  if (row.type === "WATER_COVERAGE") return typeof row.online === "boolean" && typeof row.coverageFrom === "string" && Number.isFinite(Date.parse(row.coverageFrom)) && Date.parse(row.coverageFrom) <= Date.parse(row.observedAt)
  return row.type === "BAND_READING" && (row.batteryPercent === undefined || (Number.isFinite(row.batteryPercent) && row.batteryPercent >= 0 && row.batteryPercent <= 100)) && (row.activityG === undefined || (Number.isFinite(row.activityG) && row.activityG >= 0 && row.activityG <= 16)) && Number.isFinite(row.heartRate) && row.heartRate >= 40 && row.heartRate <= 220 && Number.isFinite(row.skinTemperature) && row.skinTemperature >= 20 && row.skinTemperature <= 45 && ["VALID","LOW_SIGNAL"].includes(row.quality)
}

function signature(row: PersonalDeviceEvent) {
  return JSON.stringify([row.id,row.type,row.pekerjaKode,row.deviceId,Date.parse(row.observedAt),row.origin,
    row.type === "WATER_COVERAGE" ? [Date.parse(row.coverageFrom),row.online] : row.type === "BAND_READING" ? [row.heartRate,row.skinTemperature,row.quality,row.batteryPercent ?? null,row.activityG ?? null] : null])
}

/** Adapter boundary: events retain worker/device/time/provenance; no aggregate device animation becomes a personal reading. */
export function mergePersonalTelemetry(s: AppState, events: PersonalDeviceEvent[], receivedAt=Date.now()): { state: AppState; added: number } | { error: string } {
  const shift=currentShift(s)
  if (!shift || shift.status === "CLOSED") return { error: "Buka shift yang belum ditutup untuk menerima telemetri pekerja." }
  if (!Array.isArray(events) || !events.length || events.some(row=>!validPersonalEvent(row))) return { error: "Format telemetri pekerja tidak valid." }
  for (const event of events) {
    const eventDate=new Date(event.observedAt).toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"})
    if (!s.pekerja.some(worker=>worker.kode===event.pekerjaKode) || eventDate!==shift.tanggal || Date.parse(event.observedAt)>receivedAt+60000) return { error: "Periksa peserta dan waktu pengukuran telemetri." }
    if (event.type==="BAND_READING" && !bandWornWithConsent(s,event.deviceId,event.pekerjaKode,event.observedAt)) return { error: "Bacaan Band harus sesuai persetujuan dan periode pemakaian pekerja." }
  }
  const existing=shift.personalTelemetry ?? []
  const byId=new Map(existing.map(event=>[event.id,event]))
  for(const event of events) {
    const previous=byId.get(event.id)
    if(previous && signature(previous)!==signature(event)) return { error: "ID kejadian telemetri digunakan untuk data yang berbeda." }
    byId.set(event.id,event)
  }
  const m=managementOf(s)
  return { added: byId.size-existing.length, state: {...s,management:{...m,shifts:m.shifts.map(row=>row.id===shift.id ? {...row,personalTelemetry:[...byId.values()]} : row)}} }
}

export function bandWornWithConsent(s: AppState, bandId: string, code: string, observedAt: string) {
  const at=Date.parse(observedAt)
  return hasConsent(s,code,"BAND") && !!currentShift(s)?.bands?.some(row=>row.bandId===bandId && row.pekerjaKode===code && row.dipakaiPada && Date.parse(row.dipakaiPada)<=at && (!row.dikembalikanPada || at<=Date.parse(row.dikembalikanPada)))
}

export function ingestPersonalTelemetry(s: AppState, events: PersonalDeviceEvent[], receivedAt=Date.now()): AppState {
  const merged=mergePersonalTelemetry(s,events,receivedAt)
  if ("error" in merged) return notice(s,"error",merged.error)
  return notice(audit(merged.state,"TELEMETRI_PEKERJA",`${merged.added} kejadian pekerja diterima; sumber dan waktu pengukuran dipertahankan.`),"ok","Telemetri pekerja tersimpan.")
}

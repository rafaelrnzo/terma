import { JAM_SHIFT } from "./config"
import { currentShift, managementOf } from "./management-state"
import { bandWornWithConsent, mergePersonalTelemetry, type PersonalDeviceEvent } from "./personal-telemetry"
import { recompute } from "./store-plans"
import { notice } from "./store-utils"
import type { AppState } from "./store-state"
import type { PengukuranWBGT } from "./types"

/** Device posts as validated and stamped by terma-iot (Raya46/terma-iot reading.go). */
export type IotReading =
  | { type: "station"; deviceId: string; zone: string; airC: number; humidityPct: number; wetBulbC: number | null }
  | { type: "water"; deviceId: string; uid: string }
  | { type: "water_heartbeat"; deviceId: string; uptimeMs: number }
  | { type: "band"; deviceId: string; heartRate: number | null; skinC: number | null; spo2: number | null; battery: number | null }
export type IotEvent = IotReading & { seq: number; receivedAt: string }

export const CARD_UID = /^([0-9A-F]{2}:){3,9}[0-9A-F]{2}$/

/** Stull (2011) psychrometric wet bulb from air temperature and RH; fallback when the wick sensor is absent. */
export function stullWetBulb(t: number, rh: number) {
  return t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(t + rh) - Math.atan(rh - 1.676331) + 0.00391838 * rh ** 1.5 * Math.atan(0.023101 * rh) - 4.686035
}

/**
 * ISBB without a black globe. ponytail: Tg≈Ta (shade assumption), so 0.7·Tnwb + 0.3·Ta
 * under-reads in direct sun; add a globe sensor or a site calibration offset when one is available.
 */
export function stationWbgt(reading: Extract<IotReading, { type: "station" }>) {
  const wick = reading.wetBulbC !== null && reading.wetBulbC <= reading.airC + 1 ? reading.wetBulbC : null
  const wetBulb = wick ?? stullWetBulb(reading.airC, reading.humidityPct)
  return { isbb: Math.round((0.7 * wetBulb + 0.3 * reading.airC) * 10) / 10, wick: wick !== null }
}

const jakarta = (iso: string) => {
  const date = new Date(iso)
  return { tanggal: date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }), jam: Number(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" })) }
}

function stationRows(s: AppState, events: IotEvent[]) {
  let bacaan = s.bacaan, changed = false
  for (const event of events) {
    if (event.type !== "station") continue
    const { tanggal, jam } = jakarta(event.receivedAt)
    if (tanggal !== s.tanggal || !JAM_SHIFT.includes(jam)) continue
    const { isbb, wick } = stationWbgt(event)
    const slot = (row: PengukuranWBGT) => row.zonaKode === event.zone && row.tanggal === tanggal && row.jamMulai === jam
    const old = bacaan.find(slot)
    // Human entries win; within the hour the device keeps the highest (most protective) value.
    if (old && (old.origin === "MANUAL" || (old.idAlat === event.deviceId && old.isbb >= isbb))) continue
    const row: PengukuranWBGT = { zonaKode: event.zone, tanggal, jamMulai: jam, isbb, idAlat: event.deviceId, pencatat: "TERMA Station", kalibrasi: wick ? "Tanpa globe: 0,7·Tnw(sumbu basah) + 0,3·Ta" : "Tanpa globe: 0,7·Tw(Stull, DHT11) + 0,3·Ta", origin: "AKTUAL", waktuCatat: event.receivedAt }
    bacaan = [...bacaan.filter(item => !slot(item)), row]
    changed = true
  }
  return changed ? bacaan : null
}

function personalEvents(s: AppState, events: IotEvent[]) {
  const workers = managementOf(s).workers
  const participants = new Set(s.pekerja.map(worker => worker.kode))
  const out: PersonalDeviceEvent[] = []
  const unknownCards: string[] = []
  for (const event of events) {
    const base = { deviceId: event.deviceId, observedAt: event.receivedAt, origin: "AKTUAL" as const }
    if (event.type === "water") {
      const worker = workers.find(row => row.kartuUid === event.uid)
      if (worker && participants.has(worker.kode)) out.push({ ...base, id: `${event.deviceId}:${event.receivedAt}`, type: "WATER_VISIT", pekerjaKode: worker.kode })
      else unknownCards.push(event.uid)
    } else if (event.type === "water_heartbeat") {
      const coverageFrom = new Date(Date.parse(event.receivedAt) - event.uptimeMs).toISOString()
      for (const code of participants) out.push({ ...base, id: `${event.deviceId}:cov:${code}:${event.receivedAt}`, type: "WATER_COVERAGE", pekerjaKode: code, coverageFrom, online: true })
    } else if (event.type === "band" && event.heartRate !== null && event.skinC !== null) {
      const wearer = currentShift(s)?.bands?.find(row => row.bandId === event.deviceId && !row.dikembalikanPada && !row.dibatalkanPada)?.pekerjaKode
      if (wearer && participants.has(wearer) && bandWornWithConsent(s, event.deviceId, wearer, event.receivedAt)) {
        out.push({ ...base, id: `${event.deviceId}:${event.receivedAt}`, type: "BAND_READING", pekerjaKode: wearer, heartRate: event.heartRate, skinTemperature: event.skinC, quality: "VALID", batteryPercent: event.battery ?? undefined })
      }
    }
  }
  return { out, unknownCards }
}

/** Polled device events -> existing TERMA records. Silent per poll: no audit entry or toast for routine samples. */
export function ingestIot(s: AppState, events: IotEvent[]): AppState {
  const shift = currentShift(s)
  if (!shift || shift.status === "CLOSED" || !events.length) return s
  let next = s
  const bacaan = stationRows(s, events)
  if (bacaan) next = recompute({ ...next, bacaan })
  const { out, unknownCards } = personalEvents(next, events)
  const sameDay = out.filter(event => jakarta(event.observedAt).tanggal === shift.tanggal)
  if (sameDay.length) {
    const merged = mergePersonalTelemetry(next, sameDay)
    if ("state" in merged) next = merged.state
  }
  return unknownCards.length ? notice(next, "info", `Kartu ${unknownCards.at(-1)} belum terdaftar pada peserta shift. Isi "UID kartu" di data pekerja.`) : next
}

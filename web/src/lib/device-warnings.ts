import { bandPhysiology, type BandReading } from "./band-physiology"
import { currentShift } from "./management-state"
import { bandWornWithConsent } from "./personal-telemetry"
import { drinkDeficit } from "./drink-monitor"
import { consentedAge } from "./clinic"
import type { AppState } from "./store-state"

/** Flowchart Perhitungan TERMA §5–6 (parameter table): pilot thresholds, not clinical validation. */
export const DEVICE_RULES = {
  coreNotAcclimatised: 38.0, // ACGIH, monitored worker not yet acclimatised
  coreAcclimatised: 38.5,
  coreMargin: 0.5, // "waspada" band below the threshold
  bandWatchPoints: 2,
  strainMinutes: 5, // HR ≥ 180 − age held this long
} as const

export interface DeviceWarnings { band?: "WASPADA" | "MERAH"; drink?: { visits: number; target: number }; reasons: string[] }

/** Band core-temperature and drink-deficit warnings for one worker in the current shift, from recorded telemetry only. */
export function deviceWarnings(s: AppState, code: string, acclimatised: boolean): DeviceWarnings {
  const events = (currentShift(s)?.personalTelemetry ?? []).filter(event => event.pekerjaKode === code)
  const reasons: string[] = []
  const result: DeviceWarnings = { reasons }

  const readings = events.filter((event): event is BandReading => event.type === "BAND_READING" && bandWornWithConsent(s, event.deviceId, code, event.observedAt))
  const core = bandPhysiology(readings)?.estimate?.temperature
  if (core !== undefined) {
    const threshold = acclimatised ? DEVICE_RULES.coreAcclimatised : DEVICE_RULES.coreNotAcclimatised
    if (core >= threshold) { result.band = "MERAH"; reasons.push(`Band: estimasi suhu inti mencapai ambang ${threshold.toFixed(1).replace(".", ",")} °C — hentikan paparan dan periksa pekerja. Nilai rinci di Klinik.`) }
    else if (core >= threshold - DEVICE_RULES.coreMargin) { result.band = "WASPADA"; reasons.push(`Band waspada: estimasi suhu inti mendekati ambang ${threshold.toFixed(1).replace(".", ",")} °C (+${DEVICE_RULES.bandWatchPoints}).`) }
  }

  // Heat strain sign: heart rate held at or above 180 − age for the last five minutes (age from the consented clinic profile).
  const age = consentedAge(s, code)
  const latest = readings.at(-1)
  if (age !== undefined && latest && result.band !== "MERAH") {
    const end = Date.parse(latest.observedAt)
    const window = readings.filter(row => Date.parse(row.observedAt) >= end - DEVICE_RULES.strainMinutes * 60_000)
    const covered = window.length > 0 && end - Date.parse(window[0].observedAt) >= (DEVICE_RULES.strainMinutes - 0.5) * 60_000
    if (covered && window.every(row => row.heartRate >= 180 - age)) {
      result.band = "MERAH"
      reasons.push(`Band: denyut bertahan di atas batas sesuai usia selama ${DEVICE_RULES.strainMinutes} menit — hentikan paparan dan periksa pekerja. Nilai rinci di Klinik.`)
    }
  }

  const drink = drinkDeficit(currentShift(s), code)
  if (drink?.behind) {
    result.drink = { visits: drink.visits, target: Math.floor(drink.target) }
    reasons.push(`Defisit minum: ${drink.visits} dari target ${Math.floor(drink.target)} kunjungan Water Station sejauh ini. Tanda jeda kunjungan, bukan ukuran volume atau diagnosis dehidrasi.`)
  }
  return result
}

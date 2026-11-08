import { bandPhysiology, type BandReading } from "./band-physiology"
import { currentShift } from "./management-state"
import { bandWornWithConsent } from "./personal-telemetry"
import type { AppState } from "./store-state"

/** Flowchart Perhitungan TERMA §5–6 (parameter table): pilot thresholds, not clinical validation. */
export const DEVICE_RULES = {
  coreNotAcclimatised: 38.0, // ACGIH, monitored worker not yet acclimatised
  coreAcclimatised: 38.5,
  coreMargin: 0.5, // "waspada" band below the threshold
  drinkTargetMinutes: 30, // interval_minum, normal condition
  drinkGapFactor: 1.5, // n_faktor
  coverageFreshMinutes: 15,
  bandWatchPoints: 2,
} as const

export interface DeviceWarnings { band?: "WASPADA" | "MERAH"; drinkGapMinutes?: number; reasons: string[] }

/** Band core-temperature and drink-gap warnings for one worker in the current shift, from recorded telemetry only. */
export function deviceWarnings(s: AppState, code: string, acclimatised: boolean): DeviceWarnings {
  const events = (currentShift(s)?.personalTelemetry ?? []).filter(event => event.pekerjaKode === code)
  const reasons: string[] = []
  const result: DeviceWarnings = { reasons }

  const readings = events.filter((event): event is BandReading => event.type === "BAND_READING" && bandWornWithConsent(s, event.deviceId, code, event.observedAt))
  const core = bandPhysiology(readings)?.estimate?.temperature
  if (core !== undefined) {
    const threshold = acclimatised ? DEVICE_RULES.coreAcclimatised : DEVICE_RULES.coreNotAcclimatised
    const value = core.toFixed(1).replace(".", ",")
    if (core >= threshold) { result.band = "MERAH"; reasons.push(`Band: estimasi suhu inti ${value} °C ≥ ${threshold.toFixed(1).replace(".", ",")} °C (estimasi pilot) — hentikan paparan dan periksa pekerja.`) }
    else if (core >= threshold - DEVICE_RULES.coreMargin) { result.band = "WASPADA"; reasons.push(`Band waspada: estimasi suhu inti ${value} °C mendekati ambang ${threshold.toFixed(1).replace(".", ",")} °C (+${DEVICE_RULES.bandWatchPoints}).`) }
  }

  const drink = drinkLog(s, code)
  if (drink.overdue && drink.gapMinutes !== undefined) {
    result.drinkGapMinutes = drink.gapMinutes
    reasons.push(`Jeda minum ${drink.gapMinutes} menit melewati ${DRINK_LIMIT} menit (Water Station). Tanda jeda kunjungan, bukan ukuran volume atau diagnosis dehidrasi.`)
  }
  return result
}

export const DRINK_LIMIT = DEVICE_RULES.drinkTargetMinutes * DEVICE_RULES.drinkGapFactor

/**
 * One worker's Water Station record in the current shift. The gap is measured at `asOf`
 * (default: the station's latest heartbeat) and only while the station reports, so a missing
 * station never counts as a missed drink.
 */
export function drinkLog(s: AppState, code: string, asOf?: number) {
  const events = (currentShift(s)?.personalTelemetry ?? []).filter(event => event.pekerjaKode === code)
  const visits = events.filter(event => event.type === "WATER_VISIT").map(event => Date.parse(event.observedAt)).toSorted((a, b) => a - b)
  const coverage = events.filter(event => event.type === "WATER_COVERAGE" && event.online).at(-1)
  if (coverage?.type !== "WATER_COVERAGE") return { visits: visits.length, lastVisit: visits.at(-1), online: false, gapMinutes: undefined, overdue: false }
  const at = asOf ?? Date.parse(coverage.observedAt)
  const online = at - Date.parse(coverage.observedAt) <= DEVICE_RULES.coverageFreshMinutes * 60_000
  const last = visits.filter(time => time <= at).at(-1)
  const gapMinutes = Math.max(0, Math.floor((at - Math.max(last ?? 0, Date.parse(coverage.coverageFrom))) / 60_000))
  return { visits: visits.length, lastVisit: visits.at(-1), online, gapMinutes: online ? gapMinutes : undefined, overdue: online && gapMinutes > DRINK_LIMIT }
}

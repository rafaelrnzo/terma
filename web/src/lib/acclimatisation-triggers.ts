import { managementOf } from "./management-state"
import type { ShiftRecord } from "./management-types"
import type { AppState } from "./store-state"
import type { PengukuranWBGT } from "./types"

/** Acclimatisation re-triggers from the calculation flowchart §2 and §4 (2 °C thresholds, 7-day windows). */
export const ACCL_RULES = { heatWaveDelta: 2, heatWaveCut: 0.5, zoneMoveDelta: 2, windowDays: 7, minHistoryDays: 3, maxDays: 14, extensionPoints: 2 } as const

const daysBefore = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)
const measured = (rows: PengukuranWBGT[], date: string) => rows.filter(row => row.tanggal === date && row.origin !== "SINTETIS" && (!row.slot || row.slot.filter(item => item.n > 0).length >= 8))

/** Earlier shifts within the window before `date`, newest first. */
function history(s: AppState, date: string) {
  const from = daysBefore(date, ACCL_RULES.windowDays)
  return managementOf(s).shifts.filter(row => row.tanggal < date && row.tanggal >= from).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
}

function dailyMax(rows: PengukuranWBGT[], date: string) {
  const values = measured(rows, date).map(row => row.isbbMaks ?? row.isbb)
  return values.length ? Math.max(...values) : null
}

/**
 * Sudden heat: today's highest ISBB (measured, or the forecast estimate before readings exist) at least
 * 2 °C above the mean daily maximum of the previous 7 days. Only the first day of a wave is cut by 50%.
 */
export function heatWave(s: AppState, todayMax: number | null) {
  if (todayMax === null) return null
  const past = history(s, s.tanggal).map(shift => ({ date: shift.tanggal, max: dailyMax(shift.workspace.bacaan, shift.tanggal) })).filter((row): row is { date: string; max: number } => row.max !== null)
  if (past.length < ACCL_RULES.minHistoryDays) return null
  const baseline = past.reduce((sum, row) => sum + row.max, 0) / past.length
  const delta = todayMax - baseline
  if (delta < ACCL_RULES.heatWaveDelta) return null
  // First day only: yesterday was not itself ≥ 2 °C above the days before it.
  const [yesterday, ...earlier] = past
  const earlierMean = earlier.length ? earlier.reduce((sum, row) => sum + row.max, 0) / earlier.length : yesterday.max
  return { delta, firstDay: yesterday.max - earlierMean < ACCL_RULES.heatWaveDelta }
}

function zoneMean(shifts: ShiftRecord[], zone: string) {
  const values = shifts.flatMap(shift => measured(shift.workspace.bacaan, shift.tanggal).filter(row => row.zonaKode === zone).map(row => row.isbb))
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

/** Moved since the last shift to a zone whose 7-day mean ISBB is at least 2 °C higher. */
export function hotterZoneMove(s: AppState, code: string, zone: string) {
  const past = history(s, s.tanggal)
  const previousZone = past.map(shift => shift.workspace.penugasan.find(row => row.pekerjaKode === code)?.zonaKode).find(Boolean)
  if (!previousZone || previousZone === zone) return null
  const from = zoneMean(past, previousZone), to = zoneMean(past, zone)
  return from !== null && to !== null && to - from >= ACCL_RULES.zoneMoveDelta ? { from: previousZone, delta: to - from } : null
}

/** Green on each of the last `n` shifts the worker had (used to finish acclimatisation and to release a Band). */
export function greenLastShifts(s: AppState, code: string, n = 3) {
  const current = managementOf(s).shifts.find(row => row.tanggal === s.tanggal)
  const colours = managementOf(s).shifts.filter(row => row.id !== current?.id && row.tanggal < s.tanggal).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
    .map(row => row.workspace.rencana.filter(plan => plan.pekerjaKode === code && !plan.digantikan).at(-1)?.riskColour).filter(colour => colour !== undefined)
  return colours.length >= n && colours.slice(0, n).every(colour => colour === "HIJAU")
}

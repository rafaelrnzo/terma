import { JAM_SHIFT } from "./config"
import type { ShiftRecord } from "./management-types"
import type { PersonalDeviceEvent } from "./personal-telemetry"

type Coverage = Extract<PersonalDeviceEvent, { type: "WATER_COVERAGE" }>

/** Water Station rules: target interval per hour comes from the plan (30/20/15 minutes); gaps over 1.5× it alert the foreman. */
export const DRINK_RULES = { defaultIntervalMinutes: 30, gapFactor: 1.5, coverageFreshMinutes: 15, tomorrowPointDeficit: 0.25, toleranceVisits: 1 } as const

const hourStart = (date: string, hour: number) => Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00+07:00`)

function workerEvents(shift: ShiftRecord, code: string) {
  return (shift.personalTelemetry ?? []).filter(event => event.pekerjaKode === code)
}

/** The plan's drink interval for the hour containing `time` (default 30 minutes). */
export function drinkInterval(shift: ShiftRecord, code: string, time: number) {
  const plan = shift.workspace.rencana.filter(row => row.pekerjaKode === code && !row.digantikan).at(-1)
  const hour = JAM_SHIFT.find(h => time >= hourStart(shift.tanggal, h) && time < hourStart(shift.tanggal, h + 1))
  return plan?.intervals.find(row => row.jamMulai === hour)?.drinkInterval ?? DRINK_RULES.defaultIntervalMinutes
}

/**
 * Visits, last drink and the current gap, measured at `asOf` (default: the station's latest heartbeat)
 * and only while the station reports, so a missing station never counts as a missed drink.
 */
export function drinkLog(shift: ShiftRecord | undefined, code: string, asOf?: number) {
  const events = shift ? workerEvents(shift, code) : []
  const visits = events.filter(event => event.type === "WATER_VISIT").map(event => Date.parse(event.observedAt)).toSorted((a, b) => a - b)
  const coverage = events.filter(event => event.type === "WATER_COVERAGE" && event.online).at(-1)
  if (!shift || coverage?.type !== "WATER_COVERAGE") return { visits: visits.length, lastVisit: visits.at(-1), online: false, gapMinutes: undefined, limitMinutes: undefined, overdue: false }
  const at = asOf ?? Date.parse(coverage.observedAt)
  const online = at - Date.parse(coverage.observedAt) <= DRINK_RULES.coverageFreshMinutes * 60_000
  const last = visits.filter(time => time <= at).at(-1)
  const gapMinutes = Math.max(0, Math.floor((at - Math.max(last ?? 0, Date.parse(coverage.coverageFrom))) / 60_000))
  const limitMinutes = drinkInterval(shift, code, at) * DRINK_RULES.gapFactor
  return { visits: visits.length, lastVisit: visits.at(-1), online, gapMinutes: online ? gapMinutes : undefined, limitMinutes, overdue: online && gapMinutes > limitMinutes }
}

/**
 * Drink deficit over the shift hours already passed while the station reported:
 * target = Σ minutes per hour ÷ that hour's interval; deficit = max(0, 1 − visits ÷ target).
 * Behind (yellow) when visits trail the target by more than one tap.
 * ponytail: station outages inside the window still count as monitored time; track coverage gaps if that matters.
 */
export function drinkDeficit(shift: ShiftRecord | undefined, code: string, asOf?: number) {
  if (!shift) return undefined
  const events = workerEvents(shift, code)
  const coverage = events.filter((event): event is Coverage => event.type === "WATER_COVERAGE" && event.online)
  if (!coverage.length) return undefined
  const end = Math.min(asOf ?? Math.max(...coverage.map(event => Date.parse(event.observedAt))), hourStart(shift.tanggal, JAM_SHIFT[JAM_SHIFT.length - 1] + 1))
  const start = Math.max(Math.min(...coverage.map(event => Date.parse(event.coverageFrom))), hourStart(shift.tanggal, JAM_SHIFT[0]))
  if (end <= start) return undefined
  let target = 0
  for (const hour of JAM_SHIFT) {
    const overlap = Math.min(end, hourStart(shift.tanggal, hour + 1)) - Math.max(start, hourStart(shift.tanggal, hour))
    if (overlap > 0) target += overlap / 60_000 / drinkInterval(shift, code, hourStart(shift.tanggal, hour))
  }
  const visits = events.filter(event => event.type === "WATER_VISIT" && Date.parse(event.observedAt) >= start && Date.parse(event.observedAt) <= end).length
  return { target, visits, deficit: target > 0 ? Math.max(0, 1 - visits / target) : 0, behind: visits < Math.floor(target) - DRINK_RULES.toleranceVisits }
}

import { consentedAge, clinicOf, hasConsent } from "./clinic"
import { JAM_SHIFT, TUGAS } from "./config"
import { drinkDeficit } from "./drink-monitor"
import { managementOf } from "./management-state"
import type { ShiftRecord } from "./management-types"
import type { AppState } from "./store-state"
import type { Workload } from "./types"

/** Calculation flowchart §7: cumulative heat dose and kidney screening referral (pilot parameters). */
export const DOSE_RULES = {
  tRef: 25,
  weight: { RINGAN: 1, SEDANG: 1.5, BERAT: 2, SANGAT_BERAT: 2.5 } satisfies Record<Workload, number>,
  drinkFactor: 0.5,
  shiftEndHour: 17,
  overtimeMinutes: 30, // ponytail: overtime counts from 30 minutes past 17.00; tune with the site's time-keeping
  overtimeDays: 3,
  referralPercentile: 0.75,
  minHistoryDays: 30,
  kidneyAge: 45,
} as const

const at = (date: string, hour: number) => Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00+07:00`)
const checkinOf = (shift: ShiftRecord, code: string) => shift.readiness?.checkins.find(row => row.pekerjaKode === code)

/**
 * Daily dose: for each shift hour on site, max(0, ISBB′_h − 25) × workload weight (pro-rated by minutes
 * present), summed and multiplied by (1 + 0.5 × drink deficit). Hours without ISBB add nothing and are counted as gaps.
 * Without a check-out, presence runs to 17.00.
 */
export function dailyDose(shift: ShiftRecord, code: string) {
  const checkin = checkinOf(shift, code)
  const plan = shift.workspace.rencana.filter(row => row.pekerjaKode === code && !row.digantikan).at(-1)
  if (!checkin || !plan) return null
  const start = Date.parse(checkin.waktu)
  const end = checkin.pulang ? Date.parse(checkin.pulang) : at(shift.tanggal, DOSE_RULES.shiftEndHour)
  const weight = DOSE_RULES.weight[TUGAS.find(task => task.kode === plan.tugasKode)?.beban ?? "SEDANG"]
  let sum = 0, minutes = 0, missingHours = 0
  for (const hour of JAM_SHIFT) {
    const overlap = Math.max(0, Math.min(end, at(shift.tanggal, hour + 1)) - Math.max(start, at(shift.tanggal, hour))) / 60_000
    if (!overlap) continue
    minutes += overlap
    const isbb = plan.intervals.find(row => row.jamMulai === hour)?.isbb
    if (isbb === null || isbb === undefined) { missingHours++; continue }
    sum += Math.max(0, isbb - DOSE_RULES.tRef) * weight * overlap / 60
  }
  const deficit = drinkDeficit(shift, code)?.deficit ?? 0
  return { dose: sum * (1 + DOSE_RULES.drinkFactor * deficit), hoursOnSite: minutes / 60, deficit, missingHours }
}

export function overtimeMinutes(shift: ShiftRecord, code: string) {
  const pulang = checkinOf(shift, code)?.pulang
  return pulang ? Math.max(0, Math.round((Date.parse(pulang) - at(shift.tanggal, DOSE_RULES.shiftEndHour)) / 60_000)) : 0
}

/** Overtime on each of the worker's last three shifts before the current date (scores +1). */
export function overtimeStreak(s: AppState, code: string) {
  const past = managementOf(s).shifts.filter(row => row.tanggal < s.tanggal && checkinOf(row, code)).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, DOSE_RULES.overtimeDays)
  return past.length === DOSE_RULES.overtimeDays && past.every(row => overtimeMinutes(row, code) >= DOSE_RULES.overtimeMinutes)
}

/** Planned vs reported vs HSE-verified exposure minutes for the worker's actions in a shift. */
export function compliance(shift: ShiftRecord, code: string) {
  // Only actions of the worker's active plan version count; older versions were replaced.
  const active = shift.workspace.rencana.filter(plan => plan.pekerjaKode === code && !plan.digantikan).at(-1)?.id
  const rows = shift.workspace.tindakan.filter(row => row.pekerjaKode === code && row.rencanaId === active)
  const sum = (pick: (row: (typeof rows)[number]) => number | undefined) => rows.reduce((total, row) => total + (pick(row) ?? 0), 0)
  return { planned: sum(row => row.menitDirencanakan), reported: rows.some(row => row.menitDilaporkan !== undefined) ? sum(row => row.menitDilaporkan) : null, verified: rows.some(row => row.menitDiverifikasi !== undefined) ? sum(row => row.menitDiverifikasi) : null }
}

const daysBefore = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)

/** Sum of daily doses over the `days` up to and including `asOf`, with the number of days that had a dose. */
export function cumulativeDose(s: AppState, code: string, days: number, asOf = s.tanggal) {
  const from = daysBefore(asOf, days)
  const doses = managementOf(s).shifts.filter(row => row.tanggal > from && row.tanggal <= asOf).map(row => dailyDose(row, code)).filter(value => value !== null)
  return { dose: doses.reduce((sum, value) => sum + value.dose, 0), days: doses.length }
}

function percentile(values: number[], p: number) {
  const sorted = values.toSorted((a, b) => a - b)
  const index = (sorted.length - 1) * p
  return sorted[Math.floor(index)] + (sorted[Math.ceil(index)] - sorted[Math.floor(index)]) * (index - Math.floor(index))
}

/** Clinic's kidney-screening list: D90 ≥ the site's P75 (from workers with ≥ 30 days of data) plus ≥ 1 kidney risk factor → refer. */
export function kidneyReferrals(s: AppState) {
  const rows = managementOf(s).workers.filter(worker => !worker.diarsipkan).map(worker => {
    const d90 = cumulativeDose(s, worker.kode, 90)
    return { worker, d30: cumulativeDose(s, worker.kode, 30).dose, d90: d90.dose, d180: cumulativeDose(s, worker.kode, 180).dose, days: d90.days }
  })
  const eligible = rows.filter(row => row.days >= DOSE_RULES.minHistoryDays).map(row => row.d90)
  const p75 = eligible.length ? percentile(eligible, DOSE_RULES.referralPercentile) : null
  return {
    p75,
    rows: rows.map(row => {
      const profile = hasConsent(s, row.worker.kode, "MCU") ? clinicOf(s).profiles.find(item => item.pekerjaKode === row.worker.kode) : undefined
      const age = consentedAge(s, row.worker.kode)
      const factors = [profile?.hipertensi && "Hipertensi", profile?.diabetes && "Diabetes", age !== undefined && age >= DOSE_RULES.kidneyAge && `Usia ${age}`, profile?.riwayatPanas && "Riwayat sakit akibat panas"].filter((value): value is string => typeof value === "string")
      const high = p75 !== null && row.days >= DOSE_RULES.minHistoryDays && row.d90 >= p75
      return { ...row, factors, status: high ? (factors.length ? "RUJUK" as const : "PANTAU_KETAT" as const) : "PANTAU" as const }
    }).toSorted((a, b) => b.d90 - a.d90),
  }
}

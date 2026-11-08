import { managementOf } from "../management-state"
import type { AppState } from "../store-state"
import type { User } from "../types"

/**
 * What one signed-in user may receive. Clinical notes, check-in complaints and raw Band values
 * leave the server only for Klinik; the browser cannot reveal what it never got.
 */
export function projectFor(state: AppState, user: User): AppState {
  const sesi = { userId: user.id, masuk: state.sesi?.masuk ?? new Date().toISOString() }
  if (user.role === "KLINIK") return { ...state, sesi }
  const m = managementOf(state)
  return {
    ...state,
    sesi,
    management: {
      ...m,
      clinic: m.clinic ? { ...m.clinic, profiles: [], followups: [] } : m.clinic,
      shifts: m.shifts.map(shift => ({
        ...shift,
        readiness: shift.readiness ? { ...shift.readiness, checkins: shift.readiness.checkins.map(row => ({ ...row, keluhan: [] })) } : shift.readiness,
        // NaN serialises to null: the reading's existence, time and quality stay, the values do not.
        personalTelemetry: shift.personalTelemetry?.map(event => event.type === "BAND_READING" ? { ...event, heartRate: Number.NaN, skinTemperature: Number.NaN, batteryPercent: undefined } : event),
      })),
    },
  }
}

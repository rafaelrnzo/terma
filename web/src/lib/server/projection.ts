import { currentShift, managementOf } from "../management-state"
import type { AppState } from "../store-state"
import type { User } from "../types"

/**
 * What one signed-in user may receive. Clinical notes, check-in complaints and raw Band values
 * leave the server only for Klinik; the browser cannot reveal what it never got.
 */
export function projectFor(state: AppState, user: User): AppState {
  const sesi = { userId: user.id, masuk: state.sesi?.masuk ?? new Date().toISOString() }
  if (user.role === "ADMIN" || user.role === "KLINIK") return { ...state, sesi }
  if (user.role === "PEGAWAI") {
    const code = user.pekerjaKode
    const own = state.pekerja.find(worker => worker.kode === code)
    const shift = currentShift(state)
    const assigned = own && shift?.workspace.pekerja.some(worker => worker.kode === code) ? shift : undefined
    const attendance = state.kehadiran.filter(row => row.pekerjaKode === code)
    const ownShift = assigned && own ? {
      id: assigned.id, tanggal: assigned.tanggal, nama: assigned.nama, status: assigned.status,
      dibuatOleh: "", dibuatPada: "", calculationVersion: assigned.calculationVersion,
      readiness: assigned.readiness ? {
        checkins: assigned.readiness.checkins.filter(row => row.pekerjaKode === code),
        baselines: [], reviews: [],
      } : undefined,
      workspace: {
        pekerja: [own], kehadiran: attendance, penugasan: [], konfirmasi: [], bacaan: [],
        prakiraan: [], rencana: [], rencanaDihitung: false, tindakan: [], pengiriman: [],
      },
    } : undefined
    return {
      sesi, tanggal: state.tanggal, pekerja: own ? [own] : [], kehadiran: attendance,
      penugasan: [], konfirmasi: [], bacaan: [], prakiraan: [], rencana: [],
      rencanaDihitung: false, tindakan: [], pengiriman: [], imporLog: [], audit: [],
      management: { workers: own ? [own] : [], assignments: [], shifts: ownShift ? [ownShift] : [], activeId: ownShift?.id ?? null },
    }
  }
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

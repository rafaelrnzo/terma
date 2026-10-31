import { lingkupPekerja } from "./access"
import type { AppState } from "./store"
import type { Tindakan, User } from "./types"

/** Count the latest verified account of a worker's day, never multiple plan versions. */
export function monthlyExposure(state: AppState, user: User) {
  const month = state.tanggal.slice(0, 7)
  const plans = new Map(state.rencana.map(plan => [plan.id, plan]))
  const latest = new Map<string, Tindakan>()
  for (const action of state.tindakan) {
    const plan = plans.get(action.rencanaId)
    if (!plan || !plan.tanggal.startsWith(month) || action.status !== "TERVERIFIKASI" ||
      !action.waktuVerifikasi || action.menitDiverifikasi === undefined ||
      !Number.isFinite(action.menitDiverifikasi) || action.menitDiverifikasi < 0) continue
    const key = `${action.pekerjaKode}:${plan.tanggal}`
    const previous = latest.get(key)
    if (!previous || action.waktuVerifikasi > (previous.waktuVerifikasi ?? "")) latest.set(key, action)
  }
  return lingkupPekerja(user, state.pekerja).map(worker => {
    const entries = [...latest.values()].filter(action => action.pekerjaKode === worker.kode)
    const verifiedMinutes = entries.reduce((sum, action) => sum + (action.menitDiverifikasi ?? 0), 0)
    return { worker, verifiedMinutes, verifiedShifts: entries.length }
  })
}

import { lingkupPekerja } from "./access"
import { managementOf } from "./management-state"
import type { AppState } from "./store-state"
import type { User } from "./types"

export function waterVisits(state: AppState, user: User, date: string, code?: string) {
  const management = managementOf(state)
  const workers = new Map(lingkupPekerja(user, management.workers).map(worker => [worker.kode, worker]))
  const visits = new Map<string, { id: string; code: string; name: string; deviceId: string; observedAt: string; origin: "AKTUAL" | "REPLAY"; demo: boolean }>()
  for (const shift of management.shifts) {
    if (shift.tanggal !== date) continue
    for (const event of shift.personalTelemetry ?? []) {
      if (event.type !== "WATER_VISIT" || (code && event.pekerjaKode !== code)) continue
      const worker = workers.get(event.pekerjaKode)
      if (worker) visits.set(event.id, { id: event.id, code: worker.kode, name: worker.nama, deviceId: event.deviceId, observedAt: event.observedAt, origin: event.origin, demo: event.attribution === "DEMO_RAYA" })
    }
  }
  return [...visits.values()].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
}

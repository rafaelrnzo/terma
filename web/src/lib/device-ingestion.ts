import { stationReadings, TELEMETRY_ADAPTER } from "./device-telemetry"
import { audit, notice } from "./store-utils"
import { recompute } from "./store-plans"
import type { AppState } from "./store-state"

export function ingestStationReadings(state: AppState) {
  const existing = new Set(state.bacaan.map(row => `${row.tanggal}:${row.zonaKode}:${row.jamMulai}`))
  const incoming = stationReadings(state.tanggal).filter(row => !existing.has(`${row.tanggal}:${row.zonaKode}:${row.jamMulai}`))
  if (!incoming.length) return notice(state, "info", "Seluruh interval sudah memiliki bacaan. Data yang ada tetap dipertahankan.")
  const next = audit({ ...state, bacaan: [...state.bacaan, ...incoming] }, "BACAAN_PERANGKAT", `${incoming.length} interval diterima dari adapter ${TELEMETRY_ADAPTER}; tanggal ${state.tanggal}; sumber rekaman dipertahankan.`)
  return notice(recompute(next), "ok", `${incoming.length} bacaan perangkat tersimpan. Lanjutkan ke tinjauan rencana.`)
}

import { lingkupPekerja } from "./access"
import { JAM_SHIFT, ZONA } from "./config"
import { kualitasBacaan } from "./rules"
import type { AppState } from "./store"
import type { User } from "./types"

/** One date and one interval, with worker counts restricted to the current user's scope. */
export function overviewZones(state: AppState, user: User, hour: number) {
  const visible = new Set(lingkupPekerja(user, state.pekerja).map((p) => p.kode))
  return ZONA.map((zone) => {
    const workers = state.penugasan.filter((p) => visible.has(p.pekerjaKode) && p.zonaKode === zone.kode)
    const series = JAM_SHIFT.map((h) => ({ hour: h, ...kualitasBacaan(zone.kode, state.tanggal, h, state.bacaan, state.prakiraan) }))
    return {
      ...zone,
      workers: workers.length,
      ...kualitasBacaan(zone.kode, state.tanggal, hour, state.bacaan, state.prakiraan),
      series,
      valid: series.filter((s) => s.kualitas === "TERUKUR" || s.kualitas === "REPLAY").length,
    }
  })
}

export type OverviewZone = ReturnType<typeof overviewZones>[number]

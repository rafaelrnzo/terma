import { ZONA } from "./config"
import { managementOf } from "./management-state"
import { audit, notice, userById } from "./store-utils"
import type { AppState } from "./store-state"

/**
 * Where a physical TERMA Station is installed; the zone of its ISBB readings comes from here.
 * `selisihGlobe`: black-globe minus air temperature (°C) for this spot, 0 in shade; stands in for the missing globe sensor.
 */
export interface StationPlacement { deviceId: string; zonaKode: string; lat: number; lng: number; dipasangPada: string; oleh: string; selisihGlobe?: number }
export type StationPlacementAction =
  | { type: "SIMPAN_PENEMPATAN_STATION"; deviceId: string; zonaKode: string; lat: number; lng: number; selisihGlobe?: number }
  | { type: "HAPUS_PENEMPATAN_STATION"; deviceId: string }

const DEVICE_ID = /^[A-Za-z0-9_-]{2,32}$/

export function validPlacement(row: StationPlacement) {
  return !!row && DEVICE_ID.test(row.deviceId) && ZONA.some(zone => zone.kode === row.zonaKode) && Number.isFinite(row.lat) && Math.abs(row.lat) <= 90 && Number.isFinite(row.lng) && Math.abs(row.lng) <= 180 && Number.isFinite(Date.parse(row.dipasangPada)) && typeof row.oleh === "string" && (row.selisihGlobe === undefined || (Number.isFinite(row.selisihGlobe) && row.selisihGlobe >= 0 && row.selisihGlobe <= 30))
}

export function stationPlacements(s: AppState) { return managementOf(s).stationPlacements ?? [] }

/** Placement of a Station; its zone wins over the zone compiled into the firmware. */
export function placementOf(s: AppState, deviceId: string) { return stationPlacements(s).find(row => row.deviceId === deviceId) }

export function manageStationPlacement(s: AppState, a: StationPlacementAction): AppState {
  const user = userById(s.sesi?.userId)
  if (!user || !["ADMIN", "HSE", "PETUGAS_DATA"].includes(user.role)) return notice(s, "error", "Penempatan Station diatur oleh Admin, HSE, atau petugas data.")
  const m = managementOf(s)
  const rows = m.stationPlacements ?? []
  if (a.type === "HAPUS_PENEMPATAN_STATION") {
    if (!rows.some(row => row.deviceId === a.deviceId)) return notice(s, "error", "Penempatan Station tidak ditemukan.")
    const next = { ...s, management: { ...m, stationPlacements: rows.filter(row => row.deviceId !== a.deviceId) } }
    return notice(audit(next, "PENEMPATAN_STATION", `${a.deviceId} dilepas dari lokasi.`), "ok", `${a.deviceId} dilepas. Bacaan berikutnya memakai zona dari perangkat.`)
  }
  const row: StationPlacement = { deviceId: a.deviceId.trim().toUpperCase(), zonaKode: a.zonaKode, lat: a.lat, lng: a.lng, dipasangPada: new Date().toISOString(), oleh: user.nama, selisihGlobe: a.selisihGlobe || undefined }
  if (!validPlacement(row)) return notice(s, "error", "Isi ID Station (mis. TST-01), zona, koordinat, dan selisih bola hitam 0–30 °C yang valid.")
  const next = { ...s, management: { ...m, stationPlacements: [...rows.filter(item => item.deviceId !== row.deviceId), row] } }
  const zone = ZONA.find(item => item.kode === row.zonaKode)?.nama
  return notice(audit(next, "PENEMPATAN_STATION", `${row.deviceId} dipasang di ${zone} (${row.lat.toFixed(5)}, ${row.lng.toFixed(5)}).`), "ok", `${row.deviceId} tercatat di ${zone}. Bacaan ISBB berikutnya masuk ke zona ini.`)
}

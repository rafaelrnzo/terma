import { hariIni } from "./config"
import { validateManagement } from "./management-validation"
import { stateAwal, type AppState } from "./store-state"
import { tanggalValid, userById } from "./store-utils"

/** Pure helpers for the workspace document, shared by the browser and the server. */
export function emptyWorkspaceState(tanggal = hariIni()): AppState {
  return { ...stateAwal(tanggal), demo: { versi: "workspace-v3", tanggal }, management: { workers: [], assignments: [], shifts: [], activeId: null } }
}

export function readDemoState(raw: string): AppState {
  const parsed = JSON.parse(raw) as AppState
  if (!parsed.demo || !tanggalValid(parsed.tanggal) || !userById(parsed.sesi?.userId)) throw new Error("Invalid demo workspace")
  for (const key of ["pekerja", "kehadiran", "penugasan", "konfirmasi", "bacaan", "prakiraan", "rencana", "tindakan", "pengiriman", "imporLog", "audit"] as const) {
    if (!Array.isArray(parsed[key]) || parsed[key].some(item => !item || typeof item !== "object")) throw new Error("Invalid demo collection")
  }
  validateManagement(parsed)
  return { ...parsed, weather: undefined, notice: undefined }
}

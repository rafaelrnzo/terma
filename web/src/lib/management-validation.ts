import type { AppState } from "./store-state"
import type { ManagementState, ShiftWorkspace } from "./management-types"
import { tanggalValid } from "./store-utils"

function objects(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(item => item && typeof item === "object" && !Array.isArray(item))
}
function workspace(value: ShiftWorkspace) {
  return value && typeof value.rencanaDihitung === "boolean" && [value.pekerja, value.penugasan, value.kehadiran, value.konfirmasi, value.bacaan, value.prakiraan, value.rencana, value.tindakan, value.pengiriman].every(objects)
}
/** Reject incomplete snapshots before the provider can overwrite a recoverable saved workspace. */
export function validateManagement(state: AppState) {
  const m: ManagementState | undefined = state.management
  if (!m) return
  if (!objects(m.workers) || !objects(m.assignments) || !objects(m.shifts)) throw new Error("Invalid management collections")
  if (new Set(m.workers.map(worker => worker.kode)).size !== m.workers.length || m.workers.some(worker => typeof worker.kode !== "string" || typeof worker.nama !== "string" || !tanggalValid(worker.tanggalMulai))) throw new Error("Invalid workers")
  if (new Set(m.shifts.map(shift => shift.id)).size !== m.shifts.length || m.shifts.some(shift => !tanggalValid(shift.tanggal) || shift.id !== shift.tanggal || typeof shift.nama !== "string" || !["DRAFT", "ACTIVE", "CLOSED"].includes(shift.status) || !workspace(shift.workspace))) throw new Error("Invalid shift snapshots")
  if (m.activeId !== null && (!m.shifts.some(shift => shift.id === m.activeId) || m.activeId !== state.tanggal)) throw new Error("Invalid active shift")
}

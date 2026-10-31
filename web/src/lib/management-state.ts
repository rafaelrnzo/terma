import type { AppState, Action } from "./store-state"
import type { ManagementAction, ManagementState, ShiftRecord, ShiftWorkspace } from "./management-types"

export function workspaceSnapshot(s: AppState): ShiftWorkspace {
  return { pekerja: s.pekerja, penugasan: s.penugasan, kehadiran: s.kehadiran, konfirmasi: s.konfirmasi, bacaan: s.bacaan, prakiraan: s.prakiraan, rencana: s.rencana, rencanaDihitung: s.rencanaDihitung, tindakan: s.tindakan, pengiriman: s.pengiriman }
}

export function managementOf(s: AppState): ManagementState {
  if (s.management) return s.management
  const hasShift = s.rencana.length > 0 || s.bacaan.length > 0 || s.tindakan.length > 0
  const shifts: ShiftRecord[] = hasShift ? [{ id: s.tanggal, tanggal: s.tanggal, nama: `Shift contoh ${s.tanggal}`, status: "ACTIVE", dibuatOleh: "Data sebelumnya", dibuatPada: s.demo ? `${s.demo.tanggal}T00:00:00` : new Date().toISOString(), contoh: true, workspace: workspaceSnapshot(s) }] : []
  return { workers: s.pekerja, assignments: s.penugasan, shifts, activeId: hasShift ? s.tanggal : null }
}

export function ensureManagement(s: AppState): AppState {
  return s.management ? s : { ...s, management: managementOf(s) }
}

export function currentShift(s: AppState) {
  return s.management?.shifts.find(shift => shift.id === s.management?.activeId)
}

export function checkpointShift(s: AppState): AppState {
  const active = currentShift(s)
  if (!active || !s.management) return s
  return { ...s, management: { ...s.management, shifts: s.management.shifts.map(shift => shift.id === active.id ? { ...shift, workspace: workspaceSnapshot(s) } : shift) } }
}

export function allShiftWorkspaces(s: AppState) {
  return s.management?.shifts.length ? s.management.shifts.map(shift => shift.id === s.management?.activeId ? workspaceSnapshot(s) : shift.workspace) : [workspaceSnapshot(s)]
}

export function isClosedShift(s: AppState) { return currentShift(s)?.status === "CLOSED" }

export function isManagementAction(a: Action): a is ManagementAction {
  return a.type === "SIMPAN_PEKERJA" || a.type === "HAPUS_PEKERJA" || a.type === "ARSIP_PEKERJA" || a.type === "BUAT_SHIFT" || a.type === "UBAH_SHIFT" || a.type === "HAPUS_SHIFT" || a.type === "BUKA_SHIFT" || a.type === "TERBITKAN_SHIFT" || a.type === "TUTUP_SHIFT"
}

export function mutableShiftAction(a: Action) {
  return a.type !== "LOGIN" && a.type !== "HYDRATE" && a.type !== "SET_TANGGAL" && !isManagementAction(a)
}

export function shiftLabel(status: ShiftRecord["status"]) {
  switch (status) {
    case "DRAFT": return "Draft"
    case "ACTIVE": return "Berjalan"
    case "CLOSED": return "Selesai"
  }
}

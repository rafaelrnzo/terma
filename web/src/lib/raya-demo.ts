import { reducer } from "./store-reducer"
import { emptyWorkspaceState } from "./workspace-document"
import type { AppState } from "./store-state"

/** Minimal repeatable workspace for the public Raya attendance demo. */
export function rayaDemoWorkspace(date: string): AppState {
  let state = emptyWorkspaceState(date)
  state = reducer(state, { type: "SIMPAN_PEKERJA", input: {
    kode: "RAYA001", nama: "Raya", reguKode: "COR", tanggalMulai: "2026-01-01",
    tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar",
  } })
  state = reducer(state, { type: "BUAT_SHIFT", tanggal: date, nama: "Shift demo Raya", workerCodes: ["RAYA001"] })
  if (state.notice?.tipe !== "ok" || state.management?.activeId !== date) throw new Error("Gagal menyiapkan shift demo Raya")
  return { ...state, notice: undefined, management: { ...state.management, companySync: { source: "WORKSPACE", syncedAt: new Date().toISOString() } } }
}

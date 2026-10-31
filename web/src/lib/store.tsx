"use client"

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react"
import { ensureManagement, isClosedShift } from "./management-state"
import { boleh, type Aksi } from "./access"
import { hariIni } from "./config"
import { stateAwal, type AppState, type Action } from "./store-state"
import { userById, tanggalValid } from "./store-utils"
import { reducer } from "./store-reducer"
import { validateManagement } from "./management-validation"
import type { User } from "./types"

export { stateAwal, PENGGUNA_AWAL, type AppState, type Action } from "./store-state"
export function emptyWorkspaceState(tanggal = hariIni()): AppState {
  return { ...stateAwal(tanggal), demo: { versi: "workspace-v3", tanggal }, management: { workers: [], assignments: [], shifts: [], activeId: null } }
}

export { userById } from "./store-utils"
export { reducer } from "./store-reducer"
export { rencanaAktif, rencanaTanggal, kandidatUntuk, isiPesan } from "./store-plans"

// Isolated mock workspace: never read or overwrite the previous terma-v1 dataset.
export const DEMO_STORAGE_KEY = "terma-demo-v2"
export function initialDemoState(tanggal = hariIni()) {
  return { ...reducer(stateAwal(tanggal), { type: "MUAT_DEMO" }), notice: undefined }
}
export function readDemoState(raw: string): AppState {
  const parsed = JSON.parse(raw) as AppState
  if (!parsed.demo || !tanggalValid(parsed.tanggal) || !userById(parsed.sesi?.userId)) throw new Error("Invalid demo workspace")
  for (const key of ["pekerja", "kehadiran", "penugasan", "konfirmasi", "bacaan", "prakiraan", "rencana", "tindakan", "pengiriman", "imporLog", "audit"] as const) {
    if (!Array.isArray(parsed[key]) || parsed[key].some(item => !item || typeof item !== "object")) throw new Error("Invalid demo collection")
  }
  validateManagement(parsed)
  return { ...parsed, notice: undefined }
}
const Ctx = createContext<{ state: AppState; dispatch: (a: Action) => void; user: User | null; ready: boolean; storageError: string; retryStorage: () => void } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => stateAwal())
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState("")
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [saveAttempt, setSaveAttempt] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY)
      dispatch({ type: "HYDRATE", state: raw ? ensureManagement(readDemoState(raw)) : emptyWorkspaceState() })
    } catch {
      // Keep unreadable data intact. The temporary demo remains usable without overwriting it.
      dispatch({ type: "HYDRATE", state: emptyWorkspaceState() })
      setStorageBlocked(true)
      setStorageError("Data tersimpan tidak dapat dibaca. Perubahan sementara belum disimpan. Muat ulang setelah masalah penyimpanan diperbaiki; data lama tetap dipertahankan.")
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || storageBlocked) return
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...state, notice: undefined }))
      setStorageError("")
    } catch {
      setStorageError("Perubahan belum tersimpan di browser. Izinkan penyimpanan situs atau kosongkan ruang perangkat, lalu coba simpan lagi. Jangan tutup halaman sebelum tersimpan.")
    }
  }, [state, ready, storageBlocked, saveAttempt])

  const value = useMemo(() => ({ state, dispatch, user: userById(state.sesi?.userId), ready, storageError, retryStorage: () => {
    if (storageBlocked) {
      try {
        const raw = localStorage.getItem(DEMO_STORAGE_KEY)
        if (raw) readDemoState(raw)
        setStorageError("Data tersimpan dilindungi. Muat ulang halaman setelah masalah penyimpanan diperbaiki.")
      } catch { setStorageError("Penyimpanan masih tidak dapat dibaca. Gunakan jendela privat; data lama tetap tidak ditimpa.") }
    } else setSaveAttempt(n => n + 1)
  } }), [state, ready, storageError, storageBlocked])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useApp must be used inside AppProvider")
  return v
}

/** UI permission check. Mirrors the reducer's check so buttons are disabled instead of failing. */
export function useIzin() {
  const { user, state } = useApp()
  return (aksi: Aksi, reguKode?: string) => !!user && boleh(user, aksi, reguKode) && (!isClosedShift(state) || aksi === "KELOLA_PEKERJA" || aksi === "KELOLA_SHIFT" || aksi === "ATUR_TANGGAL")
}

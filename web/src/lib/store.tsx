"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { isClosedShift } from "./management-state"
import { boleh, type Aksi } from "./access"
import { hariIni } from "./config"
import { stateAwal, type AppState, type Action } from "./store-state"
import { notice, userById } from "./store-utils"
import { reducer } from "./store-reducer"
import { useBmkgSync } from "./use-bmkg-sync"
import type { User } from "./types"

export { stateAwal, PENGGUNA_AWAL, type AppState, type Action } from "./store-state"
export { emptyWorkspaceState, readDemoState } from "./workspace-document"
export { userById } from "./store-utils"
export { reducer } from "./store-reducer"
export { rencanaAktif, rencanaTanggal, kandidatUntuk, isiPesan } from "./store-plans"

export function initialDemoState(tanggal = hariIni()) {
  return { ...reducer(stateAwal(tanggal), { type: "MUAT_DEMO" }), notice: undefined }
}
const Ctx = createContext<{ state: AppState; dispatch: (a: Action) => void; user: User | null; ready: boolean; signedOut: boolean; signedIn: () => void; logout: () => Promise<void>; syncError: string; retrySync: () => void; refreshWeather: () => Promise<void> } | null>(null)

/** Actions that only change this screen; everything else runs on the server as the signed-in user. */
const LOCAL_ONLY = new Set<Action["type"]>(["HYDRATE", "CUACA_MULAI", "CUACA_GAGAL"])

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => stateAwal())
  const [ready, setReady] = useState(false)
  const [signedOut, setSignedOut] = useState(false)
  const [syncError, setSyncError] = useState("")
  const [reload, setReload] = useState(0)

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" })
      if (response.status === 401) { setSignedOut(true); setReady(true); return }
      if (!response.ok) throw new Error()
      // SAFETY: the server projects the workspace it validated on load and after every action.
      const body = await response.json() as { state: AppState }
      setState(previous => ({ ...body.state, weather: previous.weather, notice: undefined }))
      setSignedOut(false)
      setSyncError("")
    } catch { setSyncError("Server TERMA belum dapat dihubungi. Data terakhir tetap ditampilkan; perubahan baru belum dikirim.") }
    setReady(true)
  }, [])

  const dispatch = useCallback((action: Action) => {
    if (action.type === "LOGIN") return // the account comes from the server session, not from the screen
    if (LOCAL_ONLY.has(action.type)) { setState(previous => reducer(previous, action)); return }
    void (async () => {
      try {
        const response = await fetch("/api/workspace/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) })
        if (response.status === 401) { setSignedOut(true); return }
        // SAFETY: shape produced by /api/workspace/actions from the server-side reducer.
        const body = await response.json() as { state?: AppState; notice?: AppState["notice"]; error?: string }
        if (!response.ok || !body.state) { setState(previous => notice(previous, "error", body.error ?? "Aksi tidak dapat diproses.")); return }
        const next = body.state
        setState(previous => ({ ...next, weather: previous.weather, notice: body.notice }))
        setSyncError("")
      } catch { setSyncError("Perubahan belum terkirim ke server TERMA. Periksa koneksi lalu ulangi aksi.") }
    })()
  }, [])

  // Another screen changed the shared workspace: fetch this user's view again.
  useEffect(() => {
    if (!ready || signedOut) return
    const source = new EventSource("/api/workspace/stream")
    let first = true
    source.onmessage = () => { if (first) { first = false; return } void load() }
    source.onerror = () => setSyncError("Koneksi langsung ke server terputus. Menyambung ulang…")
    source.onopen = () => setSyncError("")
    return () => source.close()
  }, [ready, signedOut, load])

  useEffect(() => { void load() }, [load, reload])
  const workerAccount = userById(state.sesi?.userId)?.role === "PEGAWAI"
  const refreshWeather = useBmkgSync(ready && !signedOut && !workerAccount, dispatch)

  useEffect(() => {
    if (ready && !signedOut && !workerAccount && !state.management?.companySync) dispatch({ type: "SINKRON_PERUSAHAAN" })
  }, [ready, signedOut, workerAccount, state.management?.companySync, dispatch])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    setState(stateAwal())
    setSignedOut(true)
  }, [])

  const value = useMemo(() => ({ state, dispatch, refreshWeather, user: signedOut ? null : userById(state.sesi?.userId), ready, signedOut, signedIn: () => setReload(n => n + 1), logout, syncError, retrySync: () => setReload(n => n + 1) }), [state, dispatch, refreshWeather, ready, signedOut, logout, syncError])
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
  return (aksi: Aksi, reguKode?: string) => !!user && boleh(user, aksi, reguKode) && (!isClosedShift(state) || aksi === "KELOLA_KLINIK" || aksi === "KELOLA_BASELINE" || aksi === "KELOLA_PEKERJA" || aksi === "KELOLA_SHIFT" || aksi === "ATUR_TANGGAL")
}

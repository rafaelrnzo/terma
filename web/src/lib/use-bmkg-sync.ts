"use client"

import { useCallback, useEffect, useRef, type Dispatch } from "react"
import { parseBmkgForecast } from "./bmkg"
import type { Action } from "./store-state"

export function useBmkgSync(ready: boolean, dispatch: Dispatch<Action>) {
  const pending = useRef<AbortController | null>(null)
  const refresh = useCallback(async () => {
    if (!ready) return
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    dispatch({ type: "CUACA_MULAI" })
    try {
      const response = await fetch("/api/weather", { signal: controller.signal })
      if (!response.ok) throw new Error("BMKG belum dapat dihubungi. Data sebelumnya tetap dipertahankan.")
      const raw: unknown = await response.json()
      const data = parseBmkgForecast(raw)
      if (!controller.signal.aborted) dispatch({ type: "CUACA_DITERIMA", data })
    } catch (failure) {
      if (!controller.signal.aborted) dispatch({ type: "CUACA_GAGAL", pesan: failure instanceof Error ? failure.message : "Cuaca BMKG belum dapat diperbarui." })
    }
  }, [ready, dispatch])
  useEffect(() => {
    if (!ready) return
    void refresh()
    const updateVisible = () => { if (!document.hidden) void refresh() }
    const timer = setInterval(updateVisible, 30 * 60 * 1000)
    document.addEventListener("visibilitychange", updateVisible)
    return () => { pending.current?.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", updateVisible) }
  }, [ready, refresh])
  return refresh
}

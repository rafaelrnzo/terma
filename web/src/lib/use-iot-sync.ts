"use client"

import { useEffect, type Dispatch } from "react"
import { subscribeIot } from "./iot-client"
import type { Action } from "./store-state"

const CURSOR_KEY = "terma-iot-seq"

/** Streams device events from terma-iot into the browser-local workspace as they arrive. */
export function useIotSync(ready: boolean, dispatch: Dispatch<Action>) {
  useEffect(() => {
    if (!ready) return
    return subscribeIot(Number(sessionStorage.getItem(CURSOR_KEY) ?? 0) || 0, event => {
      dispatch({ type: "TERIMA_IOT", events: [event] })
      sessionStorage.setItem(CURSOR_KEY, String(event.seq))
    })
  }, [ready, dispatch])
}

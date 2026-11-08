"use client"

import { useEffect, useState } from "react"
import type { IotEvent } from "./iot"
import { subscribeIot } from "./iot-client"

/** Live device events from terma-iot for display (the workspace ingests them separately in useIotSync). */
export function useIotEvents() {
  const [events, setEvents] = useState<IotEvent[]>([])
  const [connected, setConnected] = useState<boolean | null>(null)
  useEffect(() => subscribeIot(0, event => setEvents(previous => [...previous, event]), setConnected), [])
  return { events, connected }
}

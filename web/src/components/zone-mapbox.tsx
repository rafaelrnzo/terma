"use client"

import { useEffect, useRef } from "react"
import type { Map as MapboxMap, Marker } from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { DEMO_MAP_CENTER, DEMO_ZONE_POSITIONS } from "@/lib/zone-map"
import type { ZoneMapProps } from "./zone-map"

export default function ZoneMapbox({ zones, selected, onZone, token, onFailure }: ZoneMapProps & { token: string; onFailure: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  const latest = useRef({ zones, selected, onZone, onFailure })
  const markers = useRef<{ code: string; marker: Marker; element: HTMLButtonElement }[]>([])
  useEffect(() => {
    latest.current = { zones, selected, onZone, onFailure }
    for (const { code, element } of markers.current) {
      const zone = zones.find(z => z.kode === code)
      element.setAttribute("aria-pressed", String(selected === code))
      element.textContent = `${DEMO_ZONE_POSITIONS[code].label} · ${zone?.reading ? zone.reading.isbb.toFixed(1).replace(".", ",") + " °C" : "Belum diukur"}`
    }
  }, [zones, selected, onZone, onFailure])
  useEffect(() => {
    let disposed = false
    let map: MapboxMap | undefined
    let observer: ResizeObserver | undefined
    const fail = () => { if (!disposed) latest.current.onFailure() }
    const timeout = window.setTimeout(fail, 12000)
    async function initialize() {
      try {
        const { default: mapboxgl } = await import("mapbox-gl")
        if (disposed || !container.current) return
        if (!token.startsWith("pk.") || !mapboxgl.supported()) { fail(); return }
        map = new mapboxgl.Map({ container: container.current, accessToken: token, style: "mapbox://styles/mapbox/light-v11", center: DEMO_MAP_CENTER, zoom: 15.4, minZoom: 12, maxZoom: 18, cooperativeGestures: true })
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
        map.on("error", fail)
        map.on("load", () => {
          if (disposed || !map) return
          window.clearTimeout(timeout)
          for (const zone of latest.current.zones) {
            const position = DEMO_ZONE_POSITIONS[zone.kode]
            if (!position) continue
            const element = document.createElement("button")
            element.type = "button"
            element.className = "map-zone-marker"
            element.textContent = `${position.label} · ${zone.reading ? zone.reading.isbb.toFixed(1).replace(".", ",") + " °C" : "Belum diukur"}`
            element.setAttribute("aria-label", `Pilih ${zone.nama}`)
            element.setAttribute("aria-pressed", String(latest.current.selected === zone.kode))
            element.addEventListener("click", () => latest.current.onZone(zone.kode))
            const marker = new mapboxgl.Marker({ element }).setLngLat(position.point).addTo(map)
            markers.current.push({ code: zone.kode, marker, element })
          }
        })
        observer = new ResizeObserver(() => map?.resize())
        observer.observe(container.current)
      } catch { fail() }
    }
    void initialize()
    return () => {
      disposed = true
      window.clearTimeout(timeout)
      observer?.disconnect()
      markers.current.forEach(({ marker }) => marker.remove())
      markers.current = []
      map?.remove()
    }
  }, [token])
  return <div ref={container} className="mapbox-canvas" role="region" aria-label="Peta Mapbox dengan koordinat zona simulasi" />
}

"use client"

import { useEffect, useRef } from "react"
import type { CircleMarker, Map as LeafletMap, Marker } from "leaflet"
import "leaflet/dist/leaflet.css"
import { DEMO_MAP_CENTER, DEMO_ZONE_POSITIONS, zonePoint, type PlacedPoint } from "@/lib/zone-map"
import type { ZoneMapProps } from "./zone-map"

export default function ZoneOpenStreetMap({ zones, selected, onZone, center = DEMO_MAP_CENTER, onFailure, placements = [], onPick, picked }: ZoneMapProps & { onFailure: () => void; placements?: PlacedPoint[] }) {
  const root = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const latest = useRef({ zones, selected, onZone, onFailure, placements, onPick, picked })
  const markers = useRef<{ code: string; marker: Marker; button: HTMLButtonElement; value: HTMLSpanElement }[]>([])
  const pickMarker = useRef<CircleMarker | null>(null)
  const [longitude, latitude] = center
  useEffect(() => {
    latest.current = { zones, selected, onZone, onFailure, placements, onPick, picked }
    for (const marker of markers.current) {
      const point = zonePoint(marker.code, [longitude, latitude], placements)
      if (point) marker.marker.setLatLng([point[1], point[0]])
      const zone = zones.find(item => item.kode === marker.code)
      marker.button.setAttribute("aria-pressed", String(marker.code === selected))
      marker.value.textContent = zone?.value ?? "Belum tersedia"
    }
  }, [zones, selected, onZone, onFailure, placements, onPick, picked, longitude, latitude])
  useEffect(() => {
    if (!map.current) return
    if (!picked) { pickMarker.current?.remove(); pickMarker.current = null; return }
    if (pickMarker.current) pickMarker.current.setLatLng([picked.lat, picked.lng])
    else void import("leaflet").then(L => {
      if (!map.current || pickMarker.current || latest.current.picked !== picked) return
      pickMarker.current = L.circleMarker([picked.lat, picked.lng], { radius: 10, color: "#fff", weight: 3, fillColor: "#e46c32", fillOpacity: 1, interactive: false }).addTo(map.current)
    })
  }, [picked])
  useEffect(() => {
    let disposed = false
    let observer: ResizeObserver | undefined
    let loaded = false
    const fail = () => { if (!disposed && !loaded) latest.current.onFailure() }
    const timeout = window.setTimeout(fail, 12000)
    async function initialize() {
      try {
        const L = await import("leaflet")
        if (disposed || !root.current) return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const instance = L.map(root.current, { center: [latitude, longitude], zoom: 16, zoomSnap: .25, minZoom: 11, maxZoom: 19, scrollWheelZoom: false, zoomControl: false, zoomAnimation: !reduced, fadeAnimation: !reduced, markerZoomAnimation: !reduced })
        map.current = instance
        L.control.zoom({ zoomInTitle: "Perbesar peta", zoomOutTitle: "Perkecil peta" }).addTo(instance)
        const points = [
          ...latest.current.zones.flatMap(zone => { const point = zonePoint(zone.kode, [longitude, latitude], latest.current.placements); return point ? [L.latLng(point[1], point[0])] : [] }),
          ...latest.current.placements.map(row => L.latLng(row.lat, row.lng)),
        ]
        if (points.length) instance.fitBounds(L.latLngBounds(points), { paddingTopLeft: [85, 80], paddingBottomRight: [85, 35], maxZoom: 17, animate: false })
        const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', keepBuffer: 1 })
        tiles.on("tileload", () => { loaded = true; window.clearTimeout(timeout) })
        tiles.on("load", fail)
        tiles.addTo(instance)
        for (const zone of latest.current.zones) {
          const position = DEMO_ZONE_POSITIONS[zone.kode]
          if (!position) continue
          const point = zonePoint(zone.kode, [longitude, latitude], latest.current.placements)
          if (!point) continue
          const button = document.createElement("button")
          button.type = "button"
          button.className = "osm-zone-button"
          button.setAttribute("aria-label", `Pilih ${zone.nama}`)
          button.setAttribute("aria-pressed", String(zone.kode === latest.current.selected))
          button.style.setProperty("--zone-fill", position.color)
          const name = document.createElement("span")
          name.className = "osm-zone-name"
          name.textContent = position.label
          const value = document.createElement("span")
          value.className = "osm-zone-value"
          value.textContent = zone.value
          button.append(name, value)
          button.addEventListener("click", () => latest.current.onZone(zone.kode))
          L.DomEvent.disableClickPropagation(button)
          const marker = L.marker([point[1], point[0]], { keyboard: false, icon: L.divIcon({ html: button, className: "osm-zone-marker", iconSize: [150, 64], iconAnchor: [75, 64] }) }).addTo(instance)
          markers.current.push({ code: zone.kode, marker, button, value })
        }
        for (const station of latest.current.placements) {
          const button = document.createElement("button")
          button.type = "button"
          button.className = "osm-station-button"
          button.setAttribute("aria-label", `Pilih lokasi ${station.namaLokasi ?? station.deviceId}`)
          button.textContent = station.namaLokasi ? `${station.deviceId} · ${station.namaLokasi}` : station.deviceId
          button.addEventListener("click", () => latest.current.onPick?.(station.lat, station.lng))
          L.DomEvent.disableClickPropagation(button)
          L.marker([station.lat, station.lng], { keyboard: false, icon: L.divIcon({ html: button, className: "osm-station-marker", iconSize: [160, 38], iconAnchor: [80, 38] }) }).addTo(instance)
        }
        if (latest.current.picked) pickMarker.current = L.circleMarker([latest.current.picked.lat, latest.current.picked.lng], { radius: 10, color: "#fff", weight: 3, fillColor: "#e46c32", fillOpacity: 1, interactive: false }).addTo(instance)
        instance.on("click", event => latest.current.onPick?.(event.latlng.lat, event.latlng.lng))
        observer = new ResizeObserver(() => instance.invalidateSize({ animate: false }))
        observer.observe(root.current)
      } catch { if (!disposed) latest.current.onFailure() }
    }
    void initialize()
    return () => { disposed = true; window.clearTimeout(timeout); observer?.disconnect(); markers.current = []; pickMarker.current = null; map.current?.remove(); map.current = null }
  }, [longitude, latitude, placements])
  return <div ref={root} className="geographic-map" role="region" aria-label="Peta OpenStreetMap dengan zona kerja" />
}

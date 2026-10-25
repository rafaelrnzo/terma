"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DEMO_ZONE_POSITIONS } from "@/lib/zone-map"
import type { OverviewZone } from "@/lib/overview"

const MapboxCanvas = dynamic(() => import("./zone-mapbox"), { ssr: false, loading: () => <div className="map-loading" role="status">Memuat peta Mapbox…</div> })
const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()

export type ZoneMapProps = { zones: OverviewZone[]; selected: string; onZone: (code: string) => void }

export function ZoneMap({ zones, selected, onZone }: ZoneMapProps) {
  const [geographic, setGeographic] = useState(false)
  const [error, setError] = useState(false)
  return <div className="zone-map" data-tour="map">
    <div className="map-toolbar">
      <div><h2 className="font-heading text-lg font-semibold">Peta zona kerja</h2><p className="mt-1 text-xs text-muted-foreground">{geographic ? "Koordinat contoh" : "Skema simulasi"} · bukan posisi lapangan nyata</p></div>
      {token && <div className="flex gap-1" role="group" aria-label="Tampilan peta"><Button size="sm" variant="ghost" aria-pressed={!geographic} onClick={() => setGeographic(false)}>Skema</Button><Button size="sm" variant="ghost" aria-pressed={geographic} onClick={() => { setError(false); setGeographic(true) }}>Mapbox</Button></div>}
    </div>
    {error && <p className="map-error" role="status">Peta geografis tidak dapat dimuat. Skema tetap dapat digunakan. Pilih Mapbox untuk mencoba lagi.</p>}
    {geographic && token ? <MapboxCanvas zones={zones} selected={selected} onZone={onZone} token={token} onFailure={() => { setGeographic(false); setError(true) }} /> : <div className="zone-scheme" role="group" aria-label="Skema zona simulasi, pilih zona untuk melihat bacaan">
      <svg className="scheme-paths" viewBox="0 0 600 320" preserveAspectRatio="none" aria-hidden="true"><path d="M150 90 V160 H450 V90 M300 160 V240" fill="none" stroke="var(--card)" strokeWidth="18" /><path d="M150 90 V160 H450 V90 M300 160 V240" fill="none" stroke="var(--input)" strokeWidth="1" strokeDasharray="5 5" /></svg>
      {zones.map(z => {
        const position = DEMO_ZONE_POSITIONS[z.kode]
        if (!position) return null
        return <button type="button" key={z.kode} className="scheme-zone" style={{ left: position.x + "%", top: position.y + "%", backgroundColor: position.color }} aria-pressed={selected === z.kode} aria-label={`Pilih ${z.nama}`} onClick={() => onZone(z.kode)}>
          <span className="flex items-center justify-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden /><span>{position.label}</span></span>
          <span className="scheme-value">{z.reading ? z.reading.isbb.toFixed(1).replace(".", ",") + " °C" : "Belum diukur"}</span>
          <span className="scheme-selection">{selected === z.kode ? "Zona terpilih" : "Lihat bacaan"}</span>
        </button>
      })}
    </div>}
    <div className="map-caption"><p>Pilih area untuk melihat bacaan. Warna membedakan zona, bukan tingkat risiko.</p><details><summary>Tentang peta</summary><p>Posisi seluruh zona bersifat ilustratif, tanpa pelacakan pekerja. {token ? "Tampilan Mapbox memuat peta dari layanan eksternal dengan koordinat contoh; bukan lokasi proyek sebenarnya." : "Mapbox belum dikonfigurasi. Skema ini tetap berfungsi tanpa token atau layanan peta eksternal."}</p></details></div>
  </div>
}

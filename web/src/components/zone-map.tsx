"use client"

import dynamic from "next/dynamic"
import { useState, type CSSProperties } from "react"
import { Check, Layers3 } from "lucide-react"
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
      <div><h2 className="font-heading text-base font-semibold">Peta zona kerja</h2><p className="mt-1 text-xs text-muted-foreground">{geographic ? "Koordinat contoh" : "Skema simulasi"} · bukan posisi lapangan nyata</p></div>
      {!geographic && <span className="map-view-label"><Layers3 className="size-3.5" aria-hidden />Isometrik</span>}
      {token && <div className="flex gap-1" role="group" aria-label="Tampilan peta"><Button size="sm" variant="ghost" aria-pressed={!geographic} onClick={() => setGeographic(false)}>Skema</Button><Button size="sm" variant="ghost" aria-pressed={geographic} onClick={() => { setError(false); setGeographic(true) }}>Mapbox</Button></div>}
    </div>
    {error && <p className="map-error" role="status">Peta geografis tidak dapat dimuat. Skema tetap dapat digunakan. Pilih Mapbox untuk mencoba lagi.</p>}
    {geographic && token ? <MapboxCanvas zones={zones} selected={selected} onZone={onZone} token={token} onFailure={() => { setGeographic(false); setError(true) }} /> : <div className="zone-scheme" role="group" aria-label="Skema zona simulasi, pilih zona untuk melihat bacaan">
      <svg className="scheme-paths" viewBox="0 0 600 340" preserveAspectRatio="none" aria-hidden="true"><path d="M150 100 L300 170 L450 100 M300 170 V255" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 5" /><circle cx="300" cy="170" r="4" fill="var(--card)" stroke="var(--input)" /></svg>
      {zones.map(z => {
        const position = DEMO_ZONE_POSITIONS[z.kode]
        if (!position) return null
        return <button type="button" key={z.kode} className="scheme-zone" style={{ left: position.x + "%", top: position.y + "%", "--zone-fill": position.color } as CSSProperties} aria-pressed={selected === z.kode} aria-label={`Pilih ${z.nama}`} onClick={() => onZone(z.kode)}>
          <svg className="isometric-zone" viewBox="0 0 200 110" aria-hidden="true">
            <path className="iso-ground" d="M100 23 190 65 100 107 10 65Z" />
            <g className="iso-platform">
              <path className="iso-side" d="M10 52 100 94 100 104 10 62Z M100 94 190 52 190 62 100 104Z" />
              <path className="iso-top" d="M100 10 190 52 100 94 10 52Z" />
              <path className="iso-grid" d="M40 38 130 80 M70 24 160 66 M40 66 130 24 M70 80 160 38" />
              <path className="iso-structure" d={z.kode === "COR_B" ? "M55 43 100 22 145 43 100 64Z M55 43V60L100 81 145 60V43 M100 64V81" : z.kode === "BEK_A" ? "M55 53V27L100 6 145 27V53 M55 27 100 48 145 27 M100 48V74 M55 40 100 61 145 40" : "M52 49 100 27 148 49 100 71Z M52 49V62L100 84 148 62V49 M100 71V84 M76 38 124 60"} />
              <circle className="iso-marker" cx="100" cy={z.kode === "BEK_A" ? "6" : "22"} r="4" />
            </g>
          </svg>
          <span className="scheme-label"><span className="scheme-name">{position.label}{selected === z.kode && <Check className="size-3.5" aria-hidden />}</span><span className="scheme-value">{z.reading ? z.reading.isbb.toFixed(1).replace(".", ",") + " °C" : "Belum diukur"}</span></span>
        </button>
      })}
    </div>}
    <div className="map-caption"><p>Pilih area untuk melihat bacaan. Warna membedakan zona, bukan tingkat risiko.</p><details><summary>Tentang peta</summary><p>Posisi seluruh zona bersifat ilustratif, tanpa pelacakan pekerja. {token ? "Tampilan Mapbox memuat peta dari layanan eksternal dengan koordinat contoh; bukan lokasi proyek sebenarnya." : "Mapbox belum dikonfigurasi. Skema ini tetap berfungsi tanpa token atau layanan peta eksternal."}</p></details></div>
  </div>
}

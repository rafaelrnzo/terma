"use client"

import { useState } from "react"
import Link from "next/link"
import { ThermometerIcon, ArrowUpRightIcon, InfoIcon, MapPinIcon } from "@phosphor-icons/react"
import { WbgtChart } from "@/components/wbgt-chart"
import { QualityBadge } from "@/components/status"
import { overviewZones } from "@/lib/overview"
import { heatSeries } from "@/lib/heat-series"
import { useApp } from "@/lib/store"

export function HeatTrend() {
  const { state, user } = useApp()
  const [code, setCode] = useState("COR_B")
  if (!user) return null
  const zones = overviewZones(state, user, 12)
  const zone = zones.find(item => item.kode === code) ?? zones[0]
  const points = heatSeries(zone, state.tanggal)
  const observed = points.filter(point => point.value !== null)
  const hasGaps = observed.length !== points.length
  const peak = observed.length ? Math.max(...observed.map(point => point.value ?? -Infinity)) : null
  return <section className="summon-panel" aria-labelledby="heat-title">
    <div className="panel-heading"><div><h2 id="heat-title">Profil panas zona</h2><p>WBGT / ISBB · interval shift 08.00–16.00</p></div><Link href="/pengukuran" className="panel-link">Pengukuran<ArrowUpRightIcon size={14} /></Link></div>
    <div className="chart-body">
      <div className="zone-selector" data-tour="zones" role="group" aria-label="Pilih zona grafik">{zones.map(item => <button key={item.kode} className="zone-select" aria-pressed={item.kode === zone.kode} onClick={() => setCode(item.kode)}><MapPinIcon size={14} weight={item.kode === zone.kode ? "fill" : "regular"} />{item.nama.replace("Zona ", "").split(" (")[0]}</button>)}</div>
      <div className="chart-readout" data-tour="reading"><div><strong>{peak === null ? "—" : peak.toLocaleString("id-ID", { minimumFractionDigits: 1 })}<span>°C</span></strong><p>{peak === null ? "Belum ada pengukuran valid" : "Puncak bacaan pada shift terpilih"}</p></div><QualityBadge kualitas={zone.kualitas} /></div>
      {!observed.length ? <div className="page-empty min-h-56"><ThermometerIcon size={30} /><p>Pengukuran langsung belum tersedia.</p><p>Prakiraan tidak menggantikan bacaan sensor.</p><Link className="panel-link" href="/pengukuran">Lengkapi pengukuran<ArrowUpRightIcon /></Link></div> : hasGaps ? <div className="min-h-56"><p className="inline-note">Ada celah bacaan. Nilai ditampilkan per jam tanpa menghubungkan interval yang hilang.</p><div className="mt-5 grid grid-cols-4 gap-3">{points.map(point => <div key={point.label} className="rounded-md border p-3 text-xs"><p className="text-muted-foreground">{point.label}</p><p className="mt-2 font-medium">{point.value === null ? "Belum tersedia" : `${point.value} °C`}</p></div>)}</div></div> : <div role="img" aria-label={`Grafik WBGT ${zone.nama}, puncak ${peak} derajat Celsius`} data-heat-chart>
        <WbgtChart points={points} />
      </div>}
      <div className="chart-footer"><span className="flex items-center gap-2"><span className="status-dot text-primary" />{observed.length} / {points.length} interval dengan bacaan valid</span><span className="flex items-center gap-1.5"><InfoIcon size={14} />Batas mengikuti beban kerja & rencana HSE</span></div>
      <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer py-2">Nilai dan sumber per jam</summary><ul className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">{points.map(point => <li key={point.label}>{point.label} · {point.value === null ? "Belum tersedia" : `${point.value} °C`} · {point.quality}</li>)}</ul></details>
    </div>
  </section>
}

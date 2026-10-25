"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, ArrowRight, MapPin, Thermometer, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QualityBadge } from "@/components/status"
import { JAM_SHIFT } from "@/lib/config"
import { jam, rentangJam } from "@/lib/rules"
import type { OverviewZone } from "@/lib/overview"
import { ZoneMap } from "@/components/zone-map"

const fmt = (n: number) => n.toFixed(1).replace(".", ",")

export function ZoneOverview({ zones, selected, onZone, hour, onHour }: { zones: OverviewZone[]; selected: OverviewZone; onZone: (code: string) => void; hour: number; onHour: (hour: number) => void }) {
  const usable = selected.kualitas === "TERUKUR" || selected.kualitas === "REPLAY"
  return <section className="zone-workspace" aria-label="Pemantauan zona kerja">
    <div className="zone-list" role="group" aria-label="Pilihan zona kerja">
      {zones.map((z, index) => <Button key={z.kode} variant="ghost" className="zone-choice" aria-pressed={selected.kode === z.kode} onClick={() => onZone(z.kode)}>
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md" style={{ background: ["var(--zone-blue)", "var(--zone-ice)", "var(--zone-steel)"][index] }}><MapPin className="size-4" aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{z.nama.split(" (")[0]}</span><span className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{z.reading ? `${fmt(z.reading.isbb)} °C` : "Belum diukur"}</span><QualityBadge kualitas={z.kualitas} /></span></span>
      </Button>)}
    </div>
    <div className="zone-interval" data-tour="interval"><p className="text-sm font-medium">Interval kerja <span className="ml-2 text-xs font-normal text-muted-foreground">{rentangJam(hour)}</span></p><div className="interval-switcher" role="group" aria-label="Interval pemantauan">{JAM_SHIFT.map((h) => <Button key={h} variant="ghost" aria-pressed={h === hour} onClick={() => onHour(h)}>{jam(h)}</Button>)}</div></div>
    <ZoneMap zones={zones} selected={selected.kode} onZone={onZone} />
    <div className="zone-readout" aria-live="polite" aria-atomic="true">
      <div><div className="mb-5 flex items-center justify-between"><h2 className="font-heading text-base font-semibold">WBGT / ISBB</h2><Thermometer className="size-5" strokeWidth={1.5} aria-hidden /></div><div className="zone-temperature" data-empty={!selected.reading || undefined}>{selected.reading ? <>{fmt(selected.reading.isbb)}<small> °C</small></> : "Belum diukur"}</div><p className="mt-3 text-sm font-medium">{selected.nama}</p><p className="mt-1 text-xs text-muted-foreground">Interval {rentangJam(hour)}</p>{selected.reading && <p className="mt-2 text-xs text-muted-foreground">Dicatat {new Date(selected.reading.waktuCatat).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {selected.reading.idAlat}</p>}</div>
      <div className="border-t border-foreground/15 pt-4"><QualityBadge kualitas={selected.kualitas} /><p className="mt-3 text-sm leading-relaxed">{usable ? selected.kualitas === "REPLAY" ? "Bacaan replay, bukan pengukuran langsung. Tinjau rencana sebelum penugasan." : "Bacaan tersedia untuk interval ini. Keputusan kerja tetap mengikuti rencana HSE." : "Perlu pengukuran. Status siap tidak dapat ditentukan dari sumber ini."}</p></div>
      <div className="mt-auto"><p className="mb-4 flex items-center gap-2 text-sm"><UsersRound className="size-4" aria-hidden />{selected.workers} pekerja dalam lingkup Anda</p><Button asChild variant="outline" className="w-full bg-card"><Link href="/pengukuran">Detail pengukuran<ArrowUpRight aria-hidden /></Link></Button></div>
    </div>
  </section>
}

export function ExposureChart({ zone, hour }: { zone: OverviewZone; hour: number }) {
  const svg = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(900)
  const values = zone.series.flatMap((p) => p.reading ? [p.reading.isbb] : [])
  const hasValues = values.length > 0
  useEffect(() => {
    if (!svg.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(540, entry.contentRect.width)))
    observer.observe(svg.current)
    return () => observer.disconnect()
  }, [hasValues])
  if (!values.length) return <div className="flex min-h-48 flex-col items-start justify-center gap-3"><p className="max-w-prose text-sm leading-relaxed text-muted-foreground">Belum ada bacaan WBGT untuk zona ini pada tanggal yang dipilih. Grafik akan muncul setelah pengukuran ditambahkan.</p><Button asChild variant="outline"><Link href="/pengukuran">Tambah pengukuran<ArrowRight aria-hidden /></Link></Button></div>
  const min = Math.floor(Math.min(...values) - 1)
  const max = Math.ceil(Math.max(...values) + 1)
  const x = (i: number) => 42 + i * ((width - 78) / Math.max(1, zone.series.length - 1))
  const y = (v: number) => 162 - ((v - min) / (max - min)) * 130
  return <svg ref={svg} className="data-chart" viewBox={`0 0 ${width} 208`} role="img" aria-label={`Bacaan WBGT ${zone.nama}: ${zone.series.map((p) => `${jam(p.hour)} ${p.reading ? fmt(p.reading.isbb) + ' derajat Celsius' : 'tidak tersedia'}`).join('; ')}`}>
    {[min, (min + max) / 2, max].map((v) => <g key={v}><line x1="42" x2={width - 36} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 5" /><text x="2" y={y(v) + 4}>{fmt(v)}°</text></g>)}
    {zone.series.map((p, i) => {
      const next = zone.series[i + 1]
      return <g key={p.hour}>
        {p.reading && next?.reading && <line x1={x(i)} y1={y(p.reading.isbb)} x2={x(i + 1)} y2={y(next.reading.isbb)} stroke="var(--primary)" strokeWidth="2" />}
        {p.reading && <circle cx={x(i)} cy={y(p.reading.isbb)} r={p.hour === hour ? 6 : 3.5} fill={p.kualitas === "KEDALUWARSA" ? "var(--destructive)" : "var(--primary)"} stroke="var(--card)" strokeWidth="2"><title>{jam(p.hour)} · {fmt(p.reading.isbb)} °C · {p.kualitas}</title></circle>}
        <text x={x(i)} y="193" textAnchor="middle">{jam(p.hour)}</text>
      </g>
    })}
  </svg>
}

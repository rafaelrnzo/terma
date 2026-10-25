"use client"

import Link from "next/link"
import { ArrowUpRight, ArrowRight, MapPin, Thermometer, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QualityBadge } from "@/components/status"
import { JAM_SHIFT } from "@/lib/config"
import { jam, rentangJam } from "@/lib/rules"
import type { OverviewZone } from "@/lib/overview"

const fmt = (n: number) => n.toFixed(1).replace(".", ",")

export function ZoneOverview({ zones, selected, onZone, hour, onHour }: { zones: OverviewZone[]; selected: OverviewZone; onZone: (code: string) => void; hour: number; onHour: (hour: number) => void }) {
  const usable = selected.kualitas === "TERUKUR" || selected.kualitas === "REPLAY"
  return <section className="zone-workspace" aria-label="Pemantauan zona kerja">
    <div className="zone-list">
      <div className="mb-2 flex items-center justify-between px-2"><h2 className="font-heading text-lg font-semibold">Zona kerja</h2><span className="text-xs text-muted-foreground">{zones.length} area</span></div>
      {zones.map((z, index) => <Button key={z.kode} variant="ghost" className="zone-choice" aria-pressed={selected.kode === z.kode} onClick={() => onZone(z.kode)}>
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md" style={{ background: ["var(--zone-blue)", "var(--zone-lime)", "var(--zone-sage)"][index] }}><MapPin className="size-4" aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{z.nama.split(" (")[0]}</span><span className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{z.reading ? `${fmt(z.reading.isbb)} °C` : "Belum diukur"}</span><QualityBadge kualitas={z.kualitas} /></span></span>
      </Button>)}
      <p className="mt-auto px-2 pt-4 text-xs leading-relaxed text-muted-foreground">Kualitas sumber ditampilkan terpisah dari status tindakan pekerja.</p>
    </div>
    <div className="zone-canvas">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-semibold">Situasi lokasi</h2><p className="mt-1 text-xs text-muted-foreground">Skema zona · bukan denah atau pelacakan langsung</p></div><span className="rounded-md bg-card/80 px-3 py-2 text-xs">{rentangJam(hour)}</span></div>
      <ZoneDiagram selected={selected.kode} />
      <ZoneDiagram selected={selected.kode} compact />
      <div className="border-t border-foreground/10 pt-4"><p className="mb-2 text-xs text-muted-foreground">Pilih interval kerja</p><div className="interval-switcher" role="group" aria-label="Interval pemantauan">{JAM_SHIFT.map((h) => <Button key={h} variant="ghost" aria-pressed={h === hour} onClick={() => onHour(h)}>{jam(h)}</Button>)}</div></div>
    </div>
    <div className="zone-readout" aria-live="polite" aria-atomic="true">
      <div><div className="mb-5 flex items-center justify-between"><h2 className="font-heading text-lg font-medium">WBGT / ISBB</h2><Thermometer className="size-5" strokeWidth={1.5} aria-hidden /></div><div className="zone-temperature">{selected.reading ? fmt(selected.reading.isbb) : "—"}<small> °C</small></div><p className="mt-3 text-sm">{selected.nama}</p><p className="mt-1 text-xs text-muted-foreground">Interval {rentangJam(hour)}</p></div>
      <div className="border-t border-foreground/15 pt-4"><QualityBadge kualitas={selected.kualitas} /><p className="mt-3 text-sm leading-relaxed">{usable ? selected.kualitas === "REPLAY" ? "Bacaan replay, bukan pengukuran langsung. Tinjau rencana sebelum penugasan." : "Bacaan tersedia untuk interval ini. Keputusan kerja tetap mengikuti rencana HSE." : "Perlu pengukuran. Status siap tidak dapat ditentukan dari sumber ini."}</p></div>
      <div className="mt-auto"><p className="mb-4 flex items-center gap-2 text-sm"><UsersRound className="size-4" aria-hidden />{selected.workers} pekerja dalam lingkup Anda</p><Button asChild variant="outline" className="w-full border-foreground/30 bg-card/60"><Link href="/pengukuran">Detail pengukuran<ArrowUpRight aria-hidden /></Link></Button></div>
    </div>
  </section>
}

function ZoneDiagram({ selected, compact = false }: { selected: string; compact?: boolean }) {
  const zones = compact ? [
    { code: "COR_B", name: "Cor B", x: 8, y: 28, w: 140, h: 70, color: "var(--zone-blue)" },
    { code: "BEK_A", name: "Bekisting A", x: 172, y: 28, w: 140, h: 70, color: "var(--zone-lime)" },
    { code: "GUDANG", name: "Gudang", x: 90, y: 162, w: 140, h: 62, color: "var(--zone-sage)" },
  ] : [
    { code: "COR_B", name: "Cor B", x: 48, y: 45, w: 190, h: 92, color: "var(--zone-blue)" },
    { code: "BEK_A", name: "Bekisting A", x: 326, y: 45, w: 190, h: 92, color: "var(--zone-lime)" },
    { code: "GUDANG", name: "Gudang", x: 191, y: 207, w: 190, h: 76, color: "var(--zone-sage)" },
  ]
  return <svg className={`zone-diagram ${compact ? "md:hidden" : "hidden md:block"}`} viewBox={compact ? "0 0 320 248" : "0 0 564 330"} role="img" aria-label={`Skema tiga zona. Zona terpilih: ${zones.find((z) => z.code === selected)?.name}. Posisi bersifat ilustratif.`}>
    <path d={compact ? "M78 98 V120 Q78 132 90 132 H230 Q242 132 242 120 V98 M160 132 V162" : "M143 137 V172 Q143 183 155 183 H410 Q421 183 421 172 V137 M286 183 V207"} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity=".4" />
    {zones.map((z) => <g key={z.code}>
      <rect className="zone-shape" x={z.x - 7} y={z.y - 7} width={z.w + 14} height={z.h + 14} rx="13" fill="none" stroke={selected === z.code ? "var(--primary)" : "transparent"} strokeWidth="1.5" />
      <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8" fill={z.color} />
      {Array.from({ length: 7 }, (_, i) => <line key={i} x1={z.x + z.w / 8 * (i + 1)} y1={z.y + 8} x2={z.x + z.w / 8 * (i + 1)} y2={z.y + z.h - 8} stroke="var(--card)" strokeWidth="1.5" opacity=".7" />)}
      {[1, 2].map((i) => <line key={i} x1={z.x + 8} y1={z.y + z.h * i / 3} x2={z.x + z.w - 8} y2={z.y + z.h * i / 3} stroke="var(--card)" strokeWidth="1.5" opacity=".7" />)}
      <rect x={z.x + (z.w - 128) / 2} y={z.y + z.h / 2 - 14} width="128" height="28" rx="6" fill="var(--card)" />
      <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 5} textAnchor="middle" fontSize={compact ? 16 : 14} fontWeight="500" fill="var(--foreground)">{z.name}</text>
    </g>)}
    <circle cx={compact ? 160 : 286} cy={compact ? 132 : 183} r="5" fill="var(--primary)" />
  </svg>
}

export function ExposureChart({ zone, hour }: { zone: OverviewZone; hour: number }) {
  const values = zone.series.flatMap((p) => p.reading ? [p.reading.isbb] : [])
  if (!values.length) return <div className="flex min-h-48 flex-col items-start justify-center gap-3"><p className="max-w-prose text-sm leading-relaxed text-muted-foreground">Belum ada bacaan WBGT untuk zona ini pada tanggal yang dipilih. Grafik akan muncul setelah pengukuran ditambahkan.</p><Button asChild variant="outline"><Link href="/pengukuran">Tambah pengukuran<ArrowRight aria-hidden /></Link></Button></div>
  const min = Math.floor(Math.min(...values) - 1)
  const max = Math.ceil(Math.max(...values) + 1)
  const x = (i: number) => 42 + i * 66
  const y = (v: number) => 162 - ((v - min) / (max - min)) * 130
  return <svg className="data-chart" viewBox="0 0 540 208" role="img" aria-label={`Bacaan WBGT ${zone.nama}: ${zone.series.map((p) => `${jam(p.hour)} ${p.reading ? fmt(p.reading.isbb) + ' derajat Celsius' : 'tidak tersedia'}`).join('; ')}`}>
    {[min, (min + max) / 2, max].map((v) => <g key={v}><line x1="42" x2="504" y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 5" /><text x="2" y={y(v) + 4}>{fmt(v)}°</text></g>)}
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

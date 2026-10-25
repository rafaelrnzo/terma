"use client"

import { useState } from "react"
import { ExposureChart, ZoneOverview } from "@/components/zone-overview"
import { QualityBadge } from "@/components/status"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { JAM_SHIFT } from "@/lib/config"
import { overviewZones } from "@/lib/overview"
import { jam } from "@/lib/rules"
import { useApp } from "@/lib/store"

export function HeatMonitor() {
  const { state, user } = useApp()
  const [zoneCode, setZoneCode] = useState("COR_B")
  const [hour, setHour] = useState(JAM_SHIFT[0])
  if (!user) return null
  const zones = overviewZones(state, user, hour)
  const selected = zones.find(z => z.kode === zoneCode) ?? zones[0]
  if (!selected) return <p>Belum ada zona dalam lingkup Anda.</p>
  return <div className="space-y-6">
    <ZoneOverview zones={zones} selected={selected} onZone={setZoneCode} hour={hour} onHour={setHour} />
    <Accordion type="single" collapsible defaultValue="history" className="heat-history border-t bg-card"><AccordionItem value="history" className="border-0"><AccordionTrigger className="py-5">Profil panas & riwayat bacaan · {selected.nama.split(" (")[0]}</AccordionTrigger><AccordionContent className="pb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">WBGT / ISBB (°C) · {selected.nama}</p><QualityBadge kualitas={selected.kualitas} /></div>
      <p className="mb-3 text-xs text-muted-foreground md:hidden">Geser grafik untuk melihat semua jam, 08.00–15.00.</p>
      <div className="chart-scroll" tabIndex={0} role="region" aria-label="Grafik WBGT per jam, dapat digulir"><ExposureChart zone={selected} hour={hour} /></div>
      <Accordion type="single" collapsible className="mt-3 border-t"><AccordionItem value="bacaan"><AccordionTrigger>Lihat nilai & sumber per jam</AccordionTrigger><AccordionContent><Table><TableHeader><TableRow><TableHead>Jam</TableHead><TableHead>ISBB</TableHead><TableHead>Kualitas</TableHead></TableRow></TableHeader><TableBody>{selected.series.map(p => <TableRow key={p.hour}><TableCell>{jam(p.hour)}</TableCell><TableCell>{p.reading ? p.reading.isbb.toFixed(1).replace(".", ",") + " °C" : "Belum tersedia"}</TableCell><TableCell><QualityBadge kualitas={p.kualitas} /></TableCell></TableRow>)}</TableBody></Table></AccordionContent></AccordionItem></Accordion>
    </AccordionContent></AccordionItem></Accordion>
  </div>
}

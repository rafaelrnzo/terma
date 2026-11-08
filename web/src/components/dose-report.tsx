"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { lingkupPekerja } from "@/lib/access"
import { compliance, dailyDose, overtimeMinutes } from "@/lib/heat-dose"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"

const number = (value: number, digits = 1) => value.toLocaleString("id-ID", { maximumFractionDigits: digits })
const hours = (value: number) => `${number(value)} jam`

/** End-of-shift (17.00) summary: hours on site, overtime, daily heat dose, drink deficit and planned vs actual minutes. */
export function DoseReport() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  if (!shift || !user) return null
  const rows = lingkupPekerja(user, shift.workspace.pekerja).map(worker => ({ worker, dose: dailyDose(shift, worker.kode), overtime: overtimeMinutes(shift, worker.kode), minutes: compliance(shift, worker.kode) }))
  return <section className="summon-panel mt-6" aria-labelledby="dose-title">
    <div className="panel-heading"><div><h2 id="dose-title">Dosis panas & kepatuhan</h2><p>Dosis = Σ (ISBB′ − 25 °C) × bobot beban kerja per jam hadir × (1 + 0,5 × defisit minum). Jam hadir dari absen masuk sampai absen pulang.</p></div></div>
    <div className="table-scroll" role="region" aria-label="Dosis panas per pekerja" tabIndex={0}><Table><TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Jam hadir</TableHead><TableHead>Lembur</TableHead><TableHead>Dosis harian</TableHead><TableHead>Defisit minum</TableHead><TableHead>Menit rencana / dilaporkan / diverifikasi</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(({ worker, dose, overtime, minutes }) => <TableRow key={worker.kode}>
        <TableCell><p className="font-medium">{worker.nama}</p><p className="text-xs text-muted-foreground">{worker.kode}</p></TableCell>
        <TableCell className="tabular-nums">{dose ? hours(dose.hoursOnSite) : "Belum absen"}</TableCell>
        <TableCell className="tabular-nums">{overtime ? `${overtime} menit` : "—"}</TableCell>
        <TableCell className="tabular-nums">{dose ? `${number(dose.dose)} °C·jam` : "—"}{dose?.missingHours ? <p className="text-xs text-muted-foreground">{dose.missingHours} jam tanpa ISBB</p> : null}</TableCell>
        <TableCell className="tabular-nums">{dose ? `${Math.round(dose.deficit * 100)}%` : "—"}</TableCell>
        <TableCell className="tabular-nums">{minutes.planned} / {minutes.reported ?? "—"} / {minutes.verified ?? "—"}</TableCell>
      </TableRow>)}</TableBody></Table></div>
    <p className="border-t p-5 text-xs text-muted-foreground">Dosis adalah indikator paparan kumulatif untuk penyaringan, bukan diagnosis. Tanpa absen pulang, jam hadir dihitung sampai 17.00.</p>
  </section>
}

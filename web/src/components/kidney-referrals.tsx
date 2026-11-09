"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DOSE_RULES, kidneyReferrals } from "@/lib/heat-dose"
import { useApp } from "@/lib/store"

const STATUS = { RUJUK: { variant: "riskRed", label: "Rujuk cek kreatinin / eGFR" }, PANTAU_KETAT: { variant: "riskYellow", label: "Pantau ketat" }, PANTAU: { variant: "kualitas", label: "Pantau" } } as const
const dose = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 0 })

/** Klinik only: cumulative heat dose (D30/D90/D180) and the kidney screening list. TERMA screens and refers; the doctor diagnoses. */
export function KidneyReferrals() {
  const { state, user } = useApp()
  if (user?.role !== "KLINIK" && user?.role !== "ADMIN") return null
  const { p75, rows } = kidneyReferrals(state)
  return <section className="summon-panel mt-6" aria-labelledby="kidney-title">
    <div className="panel-heading"><div><h2 id="kidney-title">Rujukan cek ginjal</h2><p>{p75 === null ? `Ambang P75 lokasi tersedia setelah ada pekerja dengan ≥ ${DOSE_RULES.minHistoryDays} hari data dosis.` : `Rujuk bila D90 ≥ P75 lokasi (${dose(p75)} °C·jam) dan ada ≥ 1 faktor risiko ginjal.`}</p></div></div>
    <div className="table-scroll" role="region" aria-label="Dosis kumulatif dan rujukan" tabIndex={0}><Table><TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>D30</TableHead><TableHead>D90</TableHead><TableHead>D180</TableHead><TableHead>Faktor risiko</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.worker.kode}>
        <TableCell><p className="font-medium">{row.worker.nama}</p><p className="text-xs text-muted-foreground">{row.worker.kode} · {row.days} hari data</p></TableCell>
        <TableCell className="tabular-nums">{dose(row.d30)}</TableCell>
        <TableCell className="tabular-nums">{dose(row.d90)}</TableCell>
        <TableCell className="tabular-nums">{dose(row.d180)}</TableCell>
        <TableCell>{row.factors.length ? row.factors.join(", ") : <span className="text-muted-foreground">Tidak tercatat / tanpa izin MCU</span>}</TableCell>
        <TableCell><Badge variant={STATUS[row.status].variant}>{STATUS[row.status].label}</Badge></TableCell>
      </TableRow>)}</TableBody></Table></div>
    <p className="border-t p-5 text-xs text-muted-foreground">Faktor risiko: hipertensi, diabetes, usia ≥ {DOSE_RULES.kidneyAge}, riwayat sakit panas. Diagnosis oleh dokter.</p>
  </section>
}

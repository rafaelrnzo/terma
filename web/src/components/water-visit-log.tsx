"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { waterVisits } from "@/lib/water-visits"
import { useApp } from "@/lib/store"

const time = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit" })

export function WaterVisitLog({ date, code, compact = false }: { date: string; code?: string; compact?: boolean }) {
  const { state, user } = useApp()
  if (!user) return null
  const visits = waterVisits(state, user, date, code)
  if (compact) return <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{visits[0] ? `Minum terakhir ${time(visits[0].observedAt)} · ${visits.length} kunjungan` : "Belum ada catatan minum"}</p>
  return <section className="summon-panel" aria-label={code ? "Log minum pekerja" : "Log minum Water Station"}>
    <div className="panel-heading"><div><h3 className="font-semibold">Log minum</h3><p>{visits.length} kunjungan tercatat · terbaru di atas</p></div></div>
    <Table aria-label="Riwayat kunjungan minum"><TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Pekerja</TableHead><TableHead>Kegiatan</TableHead><TableHead>Perangkat</TableHead></TableRow></TableHeader>
      <TableBody>{visits.slice(0, 20).map(visit => <TableRow key={visit.id}>
        <TableCell className="tabular-nums">{time(visit.observedAt)}</TableCell>
        <TableCell><p className="font-medium">{visit.name}</p><p className="text-xs text-muted-foreground">{visit.code}</p></TableCell>
        <TableCell>Kunjungan minum{visit.demo && <p className="text-xs text-muted-foreground">Pemetaan demo Raya</p>}</TableCell>
        <TableCell>{visit.deviceId}<p className="text-xs text-muted-foreground">{visit.origin}</p></TableCell>
      </TableRow>)}</TableBody></Table>
    {!visits.length && <p className="p-5 text-sm text-muted-foreground">Belum ada tap Water Station yang tercatat untuk pekerja pada tanggal ini.</p>}
    <p className="border-t p-5 text-xs text-muted-foreground">Setiap tap menjadi satu catatan kunjungan, bukan pengukuran volume air yang diminum.</p>
  </section>
}

export function WaterVisitNotifications() {
  const { state, user, ready } = useApp()
  const mounted = useRef<number | null>(null)
  const seen = useRef(new Set<string>())
  useEffect(() => {
    mounted.current ??= Date.now()
    if (!ready || !user) return
    for (const visit of waterVisits(state, user, state.tanggal)) {
      if (seen.current.has(visit.id)) continue
      seen.current.add(visit.id)
      if (visit.origin === "AKTUAL" && Date.parse(visit.observedAt) >= mounted.current) toast.info(`${visit.name} · kunjungan minum`, { id: visit.id, description: `${time(visit.observedAt)} · ${visit.deviceId}` })
    }
  }, [ready, state, user])
  return null
}

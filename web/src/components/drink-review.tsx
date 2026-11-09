"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { lingkupPekerja } from "@/lib/access"
import { REGU } from "@/lib/config"
import { drinkLog, isRayaWaterDemo } from "@/lib/drink-monitor"
import { currentShift, managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { WaterVisitLog } from "@/components/water-visit-log"

const clock = (time: number) => new Date(time).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })

/** Water Station drink record per shift participant: visits, last drink, and the gap against the target interval. */
export function DrinkReview() {
  const { state, user } = useApp()
  const [query, setQuery] = useState("")
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer) }, [])
  const shift = currentShift(state)
  if (!shift || !user) return null
  const cards = new Map(managementOf(state).workers.map(worker => [worker.kode, worker.kartuUid]))
  const demo = isRayaWaterDemo(shift)
  const rows = lingkupPekerja(user, shift.workspace.pekerja).map(worker => ({ worker, card: cards.get(worker.kode), log: drinkLog(shift, worker.kode, now) }))
  const overdue = rows.filter(row => row.log.overdue).length
  const online = rows.some(row => row.log.online)
  const filtered = rows.filter(({ worker }) => `${worker.nama} ${worker.kode}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")))
  return <section className="summon-panel" aria-labelledby="drink-title">
    <div className="panel-heading"><div><h2 id="drink-title">Minum di Water Station</h2><p>{online ? `${overdue} peserta melewati jeda minum yang ditargetkan` : "Water Station belum mengirim status. Jeda minum tidak dinilai."}</p></div></div>
    <div className="border-b p-5"><div className="max-w-sm space-y-2"><Label htmlFor="drink-search">Cari pekerja</Label><Input id="drink-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nama atau ID" /></div></div>
    <Table aria-label="Catatan minum peserta shift"><TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Kunjungan hari ini</TableHead><TableHead>Minum terakhir</TableHead><TableHead>Jeda</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>{filtered.map(({ worker, card, log }) => <TableRow key={worker.kode}>
        <TableCell><p className="font-medium">{worker.nama}</p><p className="text-xs text-muted-foreground">{worker.kode} · {REGU.find(crew => crew.kode === worker.reguKode)?.nama ?? worker.reguKode}</p></TableCell>
        <TableCell className="tabular-nums">{log.visits}</TableCell>
        <TableCell className="tabular-nums">{log.lastVisit ? clock(log.lastVisit) : "—"}</TableCell>
        <TableCell className="tabular-nums">{log.gapMinutes === undefined ? "—" : `${log.gapMinutes} menit`}</TableCell>
        <TableCell>{!card && !demo ? <Badge variant="kualitas">Kartu belum terdaftar</Badge> : !log.online ? <Badge variant="kualitas">Water Station tidak terhubung</Badge> : log.overdue ? <Badge variant="riskYellow">Jeda melewati {log.limitMinutes} menit</Badge> : <Badge variant="riskGreen">Sesuai target</Badge>}</TableCell>
      </TableRow>)}</TableBody></Table>
    {!filtered.length && <p className="p-6 text-sm text-muted-foreground">Tidak ada peserta yang cocok.</p>}
    <p className="border-t p-5 text-xs text-muted-foreground">Kunjungan dicatat saat kartu pekerja di-tap di Water Station. Catatan ini menandai jeda kunjungan, bukan volume air yang diminum.</p>
    <WaterVisitLog date={shift.tanggal} />
  </section>
}

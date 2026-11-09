"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/ui/option-select"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { lingkupPekerja } from "@/lib/access"
import { REGU } from "@/lib/config"
import { CHECKIN_METHOD_LABEL } from "@/lib/kiosk-entry"
import { ResetAttendanceButtons } from "@/components/kiosk/reset-attendance-buttons"

export const HEALTH_STATUS_LABEL = { TANPA_PEMBATASAN: "Tanpa pembatasan pada dokumen", DENGAN_PEMBATASAN: "Ada pembatasan kerja", PERLU_TINJAU: "Perlu tindak lanjut" }

/** Attendance projection only: clinical answers stay in Clinic. */
export function ShiftHealthReview() {
  const { state, user } = useApp()
  const [query,setQuery] = useState("")
  const [status,setStatus] = useState("ALL")
  const shift = currentShift(state)
  if (!shift || !user) return null
  const rows = lingkupPekerja(user, shift.workspace.pekerja).map(worker => ({ worker, checkin:shift.readiness?.checkins.find(row => row.pekerjaKode === worker.kode) }))
  const checked = rows.filter(row => row.checkin).length
  const canReset = (user.role === "ADMIN" || user.role === "HSE") && shift.status !== "CLOSED"
  const filtered = rows.filter(({worker,checkin}) => `${worker.nama} ${worker.kode} ${REGU.find(crew=>crew.kode===worker.reguKode)?.nama}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")) && (status === "ALL" || (status === "DONE" ? !!checkin : !checkin)))
  return <section className="summon-panel health-review" data-guide="health-checkin" aria-labelledby="attendance-title">
    <div className="panel-heading"><div><h2 id="attendance-title">Absensi pekerja</h2><p>{checked}/{rows.length} peserta sudah check-in</p></div><Button asChild variant="outline"><Link href={user.role === "KLINIK" ? "/klinik" : "/kiosk"}>{user.role === "KLINIK" ? "Buka kotak masuk Klinik" : "Buka layar absen"}</Link></Button></div>
    <div className="grid gap-4 border-b p-5 sm:grid-cols-[minmax(0,1fr)_14rem]"><div className="space-y-2"><Label htmlFor="attendance-search">Cari pekerja</Label><Input id="attendance-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nama, ID, atau regu" /></div><div className="space-y-2"><Label htmlFor="attendance-status">Status absensi</Label><OptionSelect id="attendance-status" value={status} onValueChange={setStatus} options={[{value:"ALL",label:"Semua peserta"},{value:"DONE",label:"Sudah check-in"},{value:"PENDING",label:"Belum check-in"}]} /></div></div>
    <div className="overflow-x-auto"><Table aria-label="Absensi peserta shift"><TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Regu</TableHead><TableHead>Status absensi</TableHead><TableHead>Waktu check-in</TableHead><TableHead>Metode</TableHead>{canReset && <TableHead>Atur ulang</TableHead>}</TableRow></TableHeader><TableBody>{filtered.map(({worker,checkin}) => <TableRow key={worker.kode}><TableCell><strong className="font-medium">{worker.nama}</strong><p className="mt-1 text-xs text-muted-foreground">{worker.kode}</p></TableCell><TableCell>{REGU.find(crew=>crew.kode===worker.reguKode)?.nama ?? worker.reguKode}</TableCell><TableCell><Badge variant="outline" className={checkin ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"}>{checkin ? <CheckCircleIcon /> : <ClockIcon />}{checkin ? "Sudah check-in" : "Belum check-in"}</Badge></TableCell><TableCell className="tabular-nums">{checkin ? new Date(checkin.waktu).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}) : "—"}</TableCell><TableCell>{checkin ? checkin.metode ? CHECKIN_METHOD_LABEL[checkin.metode] : "TERMA" : "—"}</TableCell>{canReset && <TableCell>{checkin ? <ResetAttendanceButtons workerCode={worker.kode} hasDeparture={!!checkin.pulang} compact /> : "—"}</TableCell>}</TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={canReset ? 6 : 5} className="py-10 text-center text-muted-foreground">{rows.length ? "Tidak ada pekerja yang cocok dengan filter." : "Belum ada peserta shift dalam lingkup Anda."}</TableCell></TableRow>}</TableBody></Table></div>
    {!shift.readiness && <p className="border-t p-5 text-xs text-muted-foreground">Shift lama ini belum memiliki pencatatan check-in.</p>}
    <p className="border-t p-5 text-xs text-muted-foreground" role="status">{filtered.length} dari {rows.length} peserta</p>
  </section>
}

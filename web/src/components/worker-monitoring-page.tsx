"use client"

import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft"
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight"
import { PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { WorkerHealthContent } from "@/components/worker-health-detail"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { REGU, TUGAS, ZONA, hariIni } from "@/lib/config"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { workerHealthRows } from "@/lib/worker-health"

export function WorkerMonitoringPage({ code, date: requestedDate }: { code: string; date?: string }) {
  const { state, user } = useApp()
  const router = useRouter()
  if (!user || !["ADMIN", "HSE", "KLINIK"].includes(user.role)) return null
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && Number.isFinite(Date.parse(requestedDate)) ? requestedDate : hariIni()
  const row = workerHealthRows(managementOf(state), user, date).find(item => item.worker.kode === code)
  if (!row) return <WorkflowEmpty title="Pekerja tidak ditemukan" href="/impor" label="Data pekerja">Periksa ID pekerja.</WorkflowEmpty>
  return <>
    <Link href={`/impor?tanggal=${date}`} className="back-link"><ArrowLeftIcon />Data pekerja</Link>
    <div className="page-title-row">
      <div className="worker-profile-heading"><span className="worker-profile-avatar" aria-hidden>{row.worker.nama.split(" ").slice(0, 2).map(word => word[0]).join("")}</span><div><PageHeader title={row.worker.nama} summary={`${row.worker.kode} · ${REGU.find(crew => crew.kode === row.worker.reguKode)?.nama ?? row.worker.reguKode}`} /></div></div>
      <div className="monitor-date"><Label htmlFor="monitor-date">Tanggal pemantauan</Label><Input id="monitor-date" type="date" value={date} onChange={event => { if (event.target.value) router.replace(`/pemantauan/${encodeURIComponent(code)}?tanggal=${event.target.value}`, { scroll: false }) }} /></div>
    </div>
    <div className="worker-context-line"><span>{TUGAS.find(task => task.kode === row.assignment?.tugasKode)?.nama ?? "Belum ditugaskan"}</span><span>{ZONA.find(zone => zone.kode === row.assignment?.zonaKode)?.nama ?? "Zona belum diisi"}</span>{row.shift && <Button asChild size="sm" variant="ghost"><Link href={`/shift/${encodeURIComponent(row.shift.id)}`}>{row.shift.nama}<ArrowUpRightIcon /></Link></Button>}</div>
    <WorkerHealthContent key={`${code}:${date}:${user.id}`} row={row} date={date} />
  </>
}

export function WorkerMonitoringRoute() {
  const { kode } = useParams<{ kode: string }>()
  const date = useSearchParams().get("tanggal") ?? undefined
  return <WorkerMonitoringPage code={kode} date={date} />
}

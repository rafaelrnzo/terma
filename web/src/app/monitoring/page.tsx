"use client"

import Link from "next/link"
import { ArrowRightIcon, CpuIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { HeatMonitor } from "@/components/heat-monitor"
import { Button } from "@/components/ui/button"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

export default function MonitoringPage() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  if (!user || !shift) return null
  const flow = shiftTaskFlow(state, user)
  const reported = flow.actions.filter(action => action.status === "TINDAKAN_DILAPORKAN" || action.status === "TERVERIFIKASI").length
  const verified = flow.actions.filter(action => action.status === "TERVERIFIKASI").length
  const task = flow.steps[flow.current]
  const roleInstruction = user.role === "MANDOR" ? "Pantau zona regu Anda. Untuk mengakui instruksi atau mengisi laporan, buka tugas regu." : user.role === "PETUGAS_DATA" ? "Periksa cakupan bacaan. Lengkapi interval kosong melalui tugas Sensor pada alur shift." : "Pantau kondisi zona dan progres mandor. Tinjau laporan serta tutup shift melalui alur shift."
  return <>
    <PageHeader title={user.role === "MANDOR" ? "Monitoring regu" : "Monitoring shift"} summary={`Pantau data ${shift.nama} · ${tanggalLabel(shift.tanggal)}. ${roleInstruction}`} />
    <section className="monitor-context summon-panel"><div><span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span><h2>{shift.status === "CLOSED" ? "Rekaman shift yang sudah selesai" : `Tahap saat ini: ${task.title}`}</h2><p>Menampilkan bacaan tersimpan untuk interval yang dipilih. Telemetri perangkat fisik belum terhubung.</p></div><Button asChild><Link href={`/shift/${shift.id}`}>{user.role === "MANDOR" ? "Buka tugas regu" : "Buka alur shift"}<ArrowRightIcon /></Link></Button></section>
    <div className="role-metrics"><div><span>Rencana dalam lingkup Anda</span><strong>{flow.plans.length}</strong></div><div><span>Tindakan tercatat</span><strong>{flow.actions.length}</strong></div><div><span>Sudah dilaporkan</span><strong>{reported}<small> / {flow.actions.length}</small></strong></div><div><span>Diverifikasi HSE</span><strong>{verified}<small> / {flow.actions.length}</small></strong></div></div>
    <HeatMonitor />
    <div className="monitor-context summon-panel mt-6"><div className="flex items-start gap-3"><CpuIcon size={24} className="shrink-0 text-primary" /><div><h2>Perangkat pendukung monitoring</h2><p>Periksa Station, Water Station, Band, dan aliran data perangkat.</p></div></div><Button asChild variant="outline"><Link href="/perangkat">Lihat perangkat IoT<ArrowRightIcon /></Link></Button></div>
  </>
}

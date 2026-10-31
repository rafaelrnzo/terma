"use client"

import Link from "next/link"
import { ArrowRightIcon, ShieldCheckIcon, ListChecksIcon, CpuIcon, HeartbeatIcon } from "@phosphor-icons/react"
import { ShiftOverview } from "@/components/shift-navigator"
import { DemoSeed } from "@/components/demo-seed"
import { DashboardTour } from "@/components/dashboard-tour"
import { DashboardSnapshot } from "@/components/dashboard-snapshot"
import { HeatTrend } from "@/components/heat-trend"
import { AcclimatisationChart } from "@/components/acclimatisation-chart"
import { ShiftWorkers } from "@/components/shift-workers"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

export default function TodayPage() {
  const { state, user } = useApp()
  if (!user) return null
  return <>
    <div className="today-heading" data-guide="page-heading"><div><p className="eyebrow"><ShieldCheckIcon size={15} />KESELAMATAN KERJA, SETIAP HARI</p><h1>Ringkasan shift</h1><p className="mt-2 text-sm text-muted-foreground">{tanggalLabel(state.tanggal)}<span className="mx-2">/</span>{user.role === "MANDOR" ? `Regu ${user.reguKode}` : "Seluruh lokasi"}</p></div><div className="flex flex-wrap items-center gap-2"><DashboardTour /></div></div>
    {state.pekerja.length === 0 && <DemoSeed />}
    <ShiftOverview />
    <DashboardSnapshot />
    <div className="dashboard-grid">
      <div className="space-y-5"><HeatTrend /><section className="summon-panel flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-start gap-3"><span className="priority-icon"><CpuIcon size={18} /></span><div><h2 className="text-sm font-medium">Lapangan terhubung. Pekerja terlindungi.</h2><p className="mt-1 text-xs text-muted-foreground">TERMA Station · Water Station · Rotating Band</p></div></div><Link href="/perangkat" className="panel-link">Lihat ekosistem IoT<ArrowRightIcon size={14} /></Link></section></div>
      <div className="space-y-5"><section className="summon-panel" aria-labelledby="priority-title" data-tour="priority"><div className="panel-heading"><h2 id="priority-title">Serah terima yang jelas</h2><ListChecksIcon size={18} className="text-muted-foreground" /></div><div className="priority-item"><span className="priority-icon warn"><ShieldCheckIcon size={17} /></span><div><h3>HSE → Mandor → HSE</h3><p>HSE menyetujui dan membagikan rencana. Mandor mengakui dan melaporkan pelaksanaan. HSE kemudian memverifikasi.</p><Link href="/panduan" className="panel-link">Lihat alur dan tanggung jawab<ArrowRightIcon size={13} /></Link></div></div><div className="priority-item"><span className="priority-icon"><HeartbeatIcon size={17} /></span><div><h3>Riwayat paparan untuk tindak lanjut</h3><p>Tinjau durasi yang sudah diverifikasi sebelum menyiapkan rujukan klinik.</p><Link href="/kesehatan" className="panel-link">Tinjau rekap paparan<ArrowRightIcon size={13} /></Link></div></div></section><AcclimatisationChart /></div>
    </div>
    <ShiftWorkers />
    <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheckIcon size={16} className="shrink-0" />Aturan menentukan batas dasar. Model AI personal, telemetry langsung, dan data MCU masih dalam pengembangan. HSE tetap menyetujui setiap versi rencana.</p>
  </>
}

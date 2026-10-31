"use client"

import Link from "next/link"
import { UsersThreeIcon, ShieldCheckIcon, WarningCircleIcon, RadioIcon, ArrowUpRightIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { JAM_SHIFT } from "@/lib/config"
import { overviewZones } from "@/lib/overview"
import { rencanaAktif, useApp } from "@/lib/store"
import { lingkupPekerja } from "@/lib/access"

export function DashboardSnapshot() {
  const { state, user } = useApp()
  if (!user) return null
  const workers = lingkupPekerja(user, state.pekerja)
  const visible = new Set(workers.map(worker => worker.kode))
  const plans = rencanaAktif(state).filter(plan => visible.has(plan.pekerjaKode))
  const approved = plans.filter(plan => plan.disetujuiOleh).length
  const attention = plans.filter(plan => plan.status !== "RENCANA_TERSEDIA").length
  const zones = overviewZones(state, user, JAM_SHIFT[0])
  const covered = zones.reduce((sum, zone) => sum + zone.valid, 0)
  const total = zones.length * JAM_SHIFT.length
  const metrics = [
    { label: "Pekerja dalam lingkup", value: workers.length, suffix: "orang", detail: "Sesuai peran & regu Anda", Icon: UsersThreeIcon, href: "/impor", warning: false },
    { label: "Rencana disetujui", value: approved, suffix: `/ ${plans.length}`, detail: "Ditinjau oleh HSE", Icon: ShieldCheckIcon, href: "/rencana", warning: false },
    { label: "Perlu perhatian", value: attention, suffix: "pekerja", detail: "Adaptasi, pembatasan, atau tinjauan", Icon: WarningCircleIcon, href: "/insight", warning: attention > 0 },
    { label: "Cakupan bacaan", value: total ? Math.round(covered / total * 100) : 0, suffix: "%", detail: `${covered} dari ${total} interval · termasuk replay`, Icon: RadioIcon, href: "/pengukuran", warning: false },
  ]
  return <section className="metrics-grid" aria-label="Ringkasan data shift">{metrics.map(metric => <Link key={metric.label} href={metric.href} className="summon-panel metric-card group">
    <div className="metric-label"><span>{metric.label}</span><metric.Icon size={18} /></div>
    <div className={`metric-value ${metric.warning ? "tone-warning" : ""}`}>{metric.value}<span>{metric.suffix}</span></div>
    <p className="metric-foot">{metric.warning ? <WarningCircleIcon size={13} className="tone-warning" /> : <CheckCircleIcon size={13} />}<span>{metric.detail}</span><ArrowUpRightIcon className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100" size={13} /></p>
  </Link>)}</section>
}

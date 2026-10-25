"use client"

import Link from "next/link"
import { ArrowUpRight, ClipboardCheck, RadioTower, UsersRound } from "lucide-react"
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
  const zones = overviewZones(state, user, JAM_SHIFT[0])
  const covered = zones.reduce((sum, zone) => sum + zone.valid, 0)
  const total = zones.length * JAM_SHIFT.length

  return <section className="dashboard-snapshot" aria-label="Ringkasan data shift">
    <article className="snapshot-lead">
      <div className="snapshot-topline"><span className="snapshot-icon"><ClipboardCheck size={18} aria-hidden /></span><span>Rencana shift</span></div>
      <div className="snapshot-figure"><strong>{approved}<span> / {plans.length}</span></strong><p>rencana aktif disetujui HSE</p></div>
      <div className="snapshot-track" role="img" aria-label={`${approved} dari ${plans.length} rencana aktif disetujui HSE`}><span style={{ width: `${plans.length ? approved / plans.length * 100 : 0}%` }} /></div>
      <Link href="/rencana">Tinjau rencana<ArrowUpRight size={16} aria-hidden /></Link>
    </article>
    <article className="snapshot-tile snapshot-workers">
      <span className="snapshot-icon"><UsersRound size={18} aria-hidden /></span>
      <div><strong>{workers.length}</strong><h2>Pekerja dalam lingkup</h2><p>Menurut peran pengguna saat ini.</p></div>
      <Link href="/impor" aria-label="Lihat daftar pekerja"><ArrowUpRight size={18} aria-hidden /></Link>
    </article>
    <article className="snapshot-tile snapshot-coverage">
      <span className="snapshot-icon"><RadioTower size={18} aria-hidden /></span>
      <div><strong>{covered}<span> / {total}</span></strong><h2>Interval punya bacaan</h2><p>Terukur atau replay, di seluruh zona.</p></div>
      <Link href="/pengukuran" aria-label="Lihat pengukuran"><ArrowUpRight size={18} aria-hidden /></Link>
    </article>
  </section>
}

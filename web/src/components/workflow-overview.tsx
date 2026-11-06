"use client"

import Link from "next/link"
import { ArrowRightIcon, CheckIcon, UsersThreeIcon, ClipboardTextIcon, BroadcastIcon, FlagCheckeredIcon } from "@phosphor-icons/react"
import { useApp } from "@/lib/store"
import { managementOf } from "@/lib/management-state"
import type { ShiftRecord } from "@/lib/management-types"
import { shiftTaskFlow } from "@/lib/shift-task-flow"

export function WorkflowOverview({ shift }: { shift?: ShiftRecord }) {
  const { state, user } = useApp()
  const flow = user && shift ? shiftTaskFlow({ ...state, ...shift.workspace, tanggal: shift.tanggal, management: { ...managementOf(state), activeId: shift.id } }, user) : null
  const steps = [
    { title: "Siapkan data", actor: "Petugas data · Pekerja · HSE", detail: "Pekerja, baseline perusahaan, absen, dan kondisi tubuh.", icon: UsersThreeIcon, href: user?.role === "MANDOR" ? "/ringkasan" : "/impor", done: !!flow?.steps[0].done && !!flow.steps[1].done },
    { title: "Setujui rencana", actor: "HSE", detail: "Buat shift, tinjau adaptasi, lalu terbitkan rencana.", icon: ClipboardTextIcon, href: shift ? `/shift/${shift.id}` : "/ringkasan", done: !!flow?.steps[2].done },
    { title: "Jalankan & pantau", actor: "Mandor · HSE", detail: "Terima instruksi, pantau zona, laporkan pekerjaan.", icon: BroadcastIcon, href: shift ? `/shift/${shift.id}` : "/ringkasan", done: !!flow?.steps[4].done },
    { title: "Verifikasi & selesai", actor: "HSE", detail: "Periksa laporan, tutup shift, simpan hasil akhir.", icon: FlagCheckeredIcon, href: shift?.status === "CLOSED" ? "/laporan" : shift ? `/shift/${shift.id}` : "/ringkasan", done: shift?.status === "CLOSED" },
  ]
  const current = steps.findIndex(step => !step.done)
  return <section className="journey-overview summon-panel" aria-labelledby="journey-title" data-guide="workflow-map">
    <div className="journey-heading"><div><p className="eyebrow">DARI MULAI SAMPAI SELESAI</p><h2 id="journey-title">Alur satu shift</h2></div><span className="journey-finish">Selesai ketika shift ditutup HSE</span></div>
    <ol className="journey-steps">{steps.map((step, index) => <li key={step.title} data-current={current === index} data-done={step.done}><Link href={step.href} aria-current={current === index && flow ? "step" : undefined}><span className="journey-number">{step.done ? <CheckIcon size={17} /> : index + 1}</span><step.icon className="journey-icon" size={23} weight={current === index ? "fill" : "regular"} /><strong>{step.title}</strong><small>{step.actor}</small><p>{step.detail}</p><ArrowRightIcon className="journey-arrow" size={16} /></Link></li>)}</ol>
    <p className="journey-context"><Link href="/forecasting">Forecasting</Link> membantu persiapan jadwal. <Link href="/monitoring">Monitoring</Link> dipakai saat shift berjalan. Hasil tersimpan di <Link href="/laporan">Laporan & evaluasi</Link>.</p>
  </section>
}

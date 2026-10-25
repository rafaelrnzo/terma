"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DemoSeed } from "@/components/demo-seed"
import { HeatMonitor } from "@/components/heat-monitor"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { lingkupPekerja } from "@/lib/access"
import { rencanaAktif, useApp } from "@/lib/store"
import { nextWorkflowStep, workflow } from "@/lib/workflow"
import { STEP_OUTCOMES, tanggalLabel } from "@/lib/workspace"

export default function TodayPage() {
  const { state, user } = useApp()
  if (!user) return null
  const pekerja = lingkupPekerja(user, state.pekerja)
  const ids = new Set(pekerja.map(p => p.kode))
  const plans = rencanaAktif(state).filter(r => ids.has(r.pekerjaKode))
  const next = nextWorkflowStep(state, user)
  const tasks = workflow(state, user).filter(step => step.peran.includes(user.role) && step.no !== "7")
  const others = tasks.filter(step => step.href !== next.href)
  return <>
    <div className="today-heading"><div><h1 className="font-heading text-3xl font-medium sm:text-4xl">Pekerjaan hari ini</h1><p className="mt-3 text-sm text-muted-foreground">{tanggalLabel(state.tanggal)} · {user.nama}{user.role === "MANDOR" ? " · Regu " + user.reguKode : " · Seluruh lokasi"}</p></div><Link href="/laporan" className="text-sm underline underline-offset-4">Lihat laporan shift</Link></div>
    {state.pekerja.length === 0 && <DemoSeed />}
    <section className="today-priority" aria-labelledby="priority-title">
      <div><h2 id="priority-title" className="font-heading text-2xl font-medium">{next.label}</h2><p className="mt-3 text-sm font-medium">{next.progress}</p><p className="mt-2 max-w-prose text-sm text-muted-foreground">{STEP_OUTCOMES[next.href]}</p></div>
      <Button asChild size="lg"><Link href={next.href}>Lanjutkan pekerjaan<ArrowRight aria-hidden /></Link></Button>
    </section>
    <div className="today-body">
      <section aria-labelledby="tasks-title"><h2 id="tasks-title" className="mb-2 font-heading text-xl font-medium">Daftar pekerjaan</h2><p className="mb-5 text-sm text-muted-foreground">Urutan kerja untuk peran Anda. Langkah yang selesai tetap dapat dibuka.</p><div className="divide-y">{others.map(step => <Link key={step.href} href={step.href} className="task-row"><span><span className="block font-medium">{step.label}</span><span className="mt-1 block text-sm text-muted-foreground">{step.progress}</span></span><span className="flex shrink-0 items-center gap-3 text-xs"><span className={step.selesai ? "text-primary" : "text-muted-foreground"}>{step.selesai ? "Lengkap" : "Belum lengkap"}</span><ArrowRight className="size-4" aria-hidden /></span></Link>)}</div></section>
      <aside className="today-scope" aria-labelledby="scope-title"><h2 id="scope-title" className="font-heading text-xl font-medium">Lingkup shift</h2><dl className="mt-4 divide-y text-sm"><div className="flex justify-between gap-4 py-3"><dt>Pekerja</dt><dd className="font-medium tabular-nums">{pekerja.length}</dd></div><div className="flex justify-between gap-4 py-3"><dt>Rencana disetujui HSE</dt><dd className="font-medium tabular-nums">{plans.filter(r => r.disetujuiOleh).length} / {pekerja.length}</dd></div></dl><Link href="/impor" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm underline underline-offset-4">Lihat daftar pekerja<ArrowRight className="size-4" aria-hidden /></Link><p className="mt-5 text-xs leading-relaxed text-muted-foreground">Bacaan dan status berasal dari data demo pada tanggal yang dipilih, bukan pemantauan langsung.</p></aside>
    </div>
    <Accordion type="single" collapsible className="mt-10 border-y"><AccordionItem value="monitor" className="border-0"><AccordionTrigger className="py-5 text-base">Lihat kondisi panas per zona</AccordionTrigger><AccordionContent className="pt-2 pb-6"><HeatMonitor /></AccordionContent></AccordionItem></Accordion>
  </>
}

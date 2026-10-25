"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { LABEL_PERAN } from "@/lib/access"
import { REGU } from "@/lib/config"
import { useApp } from "@/lib/store"
import { workflow } from "@/lib/workflow"
import { STEP_OUTCOMES, tanggalLabel } from "@/lib/workspace"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function StepContext() {
  const { state, user } = useApp()
  const path = usePathname()
  if (!user) return null
  const step = workflow(state, user).find(s => s.href === path)
  if (!step) return null
  return <section aria-label="Konteks langkah" className="mt-5 grid gap-4 border-t pt-4 text-sm sm:grid-cols-3">
    <div><p className="text-xs text-muted-foreground">Penanggung jawab</p><p className="mt-1 font-medium">{step.peran.map(p => LABEL_PERAN[p]).join(" · ")}</p></div>
    <div><p className="text-xs text-muted-foreground">Status pada {tanggalLabel(state.tanggal)}</p><p className="mt-1 flex items-start gap-2 font-medium">{step.selesai && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}{step.progress}</p></div>
    <div><p className="text-xs text-muted-foreground">Hasil langkah ini</p><p className="mt-1">{STEP_OUTCOMES[path]}</p></div>
  </section>
}

export function ShiftContext() {
  const { state, user } = useApp()
  if (!user) return null
  const steps = workflow(state, user)
  const crews = user.role === "MANDOR" ? REGU.filter(g => g.kode === user.reguKode) : REGU
  return <section className="mb-6 rounded-lg border bg-card px-5" aria-label="Konteks shift">
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div><h2 className="font-heading text-base font-semibold">Shift pagi · 08.00–16.00</h2><p className="mt-1 text-sm text-muted-foreground">{tanggalLabel(state.tanggal)} · {user.nama}, {LABEL_PERAN[user.role]}</p></div>
      <div className="flex flex-wrap gap-2">{crews.map(g => <Link className="inline-flex min-h-11 items-center gap-2 rounded-md bg-muted px-3 text-sm hover:bg-accent" key={g.kode} href={`/regu/${g.kode.toLowerCase()}`}>{g.nama}<ArrowRight className="size-3.5" aria-hidden /></Link>)}</div>
    </div>
    <Accordion type="single" collapsible className="border-t"><AccordionItem value="shift"><AccordionTrigger>Lihat alur shift · {steps.slice(0, 6).filter(s => s.selesai).length} dari 6 tahap persiapan & tindak lanjut lengkap</AccordionTrigger><AccordionContent><ol className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">{steps.map(s => <li key={s.href}><Link className="flex min-h-20 items-start gap-3 rounded-md p-3 hover:bg-muted" href={s.href}><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs">{s.selesai ? <CheckCircle2 className="size-4" aria-label="Lengkap" /> : s.no}</span><span><span className="block font-medium">{s.label}</span><span className="mt-1 block text-xs text-muted-foreground">{s.progress}</span></span></Link></li>)}</ol></AccordionContent></AccordionItem></Accordion>
  </section>
}

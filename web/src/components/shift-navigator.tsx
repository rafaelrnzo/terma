"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRightIcon, ArrowLeftIcon, CheckIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { managedJourney } from "@/lib/managed-journey"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { isShiftRoute } from "@/lib/navigation"
import { useApp } from "@/lib/store"

export function ShiftProgress() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  if (!user || !shift) return null
  const flow = shiftTaskFlow(state, user)
  return <nav aria-label="Tahapan shift" className="wizard-route-progress no-print">{flow.steps.map((step,index) => <span key={step.key} aria-current={index === flow.current ? "step" : undefined}>{step.done ? <CheckIcon size={13} /> : index + 1} {step.title}</span>)}</nav>
}

export function ShiftFocusCard({ compact = false }: { compact?: boolean }) {
  const { state, user } = useApp()
  if (!user) return null
  const shift = currentShift(state)
  const flow = shift ? shiftTaskFlow(state,user) : null
  const first = managedJourney(state,user).focus
  const task = flow?.steps[flow.current]
  return <section data-guide={compact ? "handoff" : "current-step"} className="shift-focus no-print"><div className="shift-focus-copy"><p className="eyebrow">LANJUTKAN DI ALUR SHIFT</p><h2>{shift?.status === "CLOSED" ? "Shift sudah selesai" : flow && task ? `Langkah ${flow.current+1}: ${task.title}` : first.title}</h2><p>{task ? "Semua tugas tersedia dalam satu halaman shift, sesuai urutan dan penanggung jawabnya." : first.description}</p></div><Button asChild><Link href={shift ? `/shift/${shift.id}` : first.href}>{shift ? "Buka alur shift" : first.cta}<ArrowRightIcon /></Link></Button></section>
}

export function ShiftRouteContext() {
  const { state, user } = useApp()
  const path = usePathname()
  const shift = currentShift(state)
  if (!user || !shift || (!isShiftRoute(path) && path !== "/laporan")) return null
  return <div className="shift-route-context no-print"><Link href={`/shift/${shift.id}`} className="mb-3 inline-flex items-center gap-2 text-sm font-medium"><ArrowLeftIcon />Kembali ke alur {shift.nama}<span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span></Link></div>
}
export function ShiftOverview() { return <div className="shift-overview"><ShiftProgress /><ShiftFocusCard /></div> }

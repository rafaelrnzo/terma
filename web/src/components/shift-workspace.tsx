"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { ShiftForm } from "@/components/shift-form"
import { ConfirmAction } from "@/components/confirm-action"
import { ShiftParticipants } from "@/components/shift-participants"
import { ShiftSensorTask } from "@/components/shift-sensor-task"
import { ShiftPlanReview } from "@/components/shift-plan-review"
import { ShiftInstructions } from "@/components/shift-instructions"
import { ShiftExecution } from "@/components/shift-execution"
import { ShiftHandoff } from "@/components/shift-handoff"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { useApp, useIzin } from "@/lib/store"
import { LABEL_PERAN } from "@/lib/access"
import { tanggalLabel } from "@/lib/workspace"

export function ShiftWorkspace({ deviceFigure }: { deviceFigure: ReactNode }) {
  const { state, user, dispatch } = useApp()
  const izin = useIzin()
  const flow = user ? shiftTaskFlow(state, user) : null
  const [selected, setSelected] = useState(flow?.current ?? 0)
  const taskRoot = useRef<HTMLElement>(null)
  const current = flow?.current ?? 0
  useEffect(() => { setSelected(previous => Math.min(previous, current)) }, [current])
  const shift = currentShift(state)
  if (!user || !shift || !flow) return null
  const step = flow.steps[selected]
  const issued = state.rencana.some(plan => plan.disetujuiOleh) || state.tindakan.length > 0
  const canEdit = shift.status === "DRAFT" && !issued
  const pendingCrews = [...new Set(flow.actions.filter(action => selected === 3 ? action.status === "DISAMPAIKAN" : action.status === "DIAKUI" || action.status === "BELUM_SELESAI").map(action => action.reguKode))]
  function navigate(index: number) {
    setSelected(index)
    requestAnimationFrame(() => taskRoot.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }))
  }
  return <>
    <Link href="/ringkasan" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeftIcon />Daftar shift</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHeader title={shift.nama} summary={`${tanggalLabel(shift.tanggal)} · ${user.nama}, ${LABEL_PERAN[user.role]}`} /><span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span></div>
    {shift.status === "CLOSED" ? <section className="summon-panel p-6" data-guide="closed-shift"><CheckCircleIcon size={32} className="mb-4 text-primary" /><h2 className="text-xl font-semibold">Shift selesai.</h2><p className="mt-3 text-sm text-muted-foreground">Ditutup {shift.ditutupOleh} · {shift.ditutupPada && new Date(shift.ditutupPada).toLocaleString("id-ID")}. Peserta, rencana, dan laporan sudah dikunci.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href="/laporan">Buka laporan akhir<ArrowRightIcon /></Link></Button><Button asChild variant="outline"><Link href="/ringkasan">Kembali ke daftar shift</Link></Button></div></section> : <>
      <div className="wizard-layout"><nav aria-label="Urutan tugas shift" className="wizard-rail" data-guide="shift-tasks"><ol>{flow.steps.map((task, index) => <li key={task.key}><button disabled={index > current} aria-current={index === selected ? "step" : undefined} onClick={() => navigate(index)}><span>{task.done ? <CheckIcon size={15} /> : index > current ? <LockSimpleIcon size={13} /> : index + 1}</span><div><strong>{task.title}</strong><small>{task.done ? "Selesai" : index > current ? "Setelah langkah sebelumnya" : "Sedang dikerjakan"}</small></div></button></li>)}</ol></nav>
      <section ref={taskRoot} className="wizard-task summon-panel" data-guide="current-step" aria-labelledby="wizard-task-title"><header className="wizard-task-header"><div><p className="eyebrow">LANGKAH {selected + 1} DARI {flow.steps.length}</p><h2 id="wizard-task-title">{step.title}</h2><p>{step.description}</p></div></header>
        <div className="wizard-task-body">{!step.done && <ShiftHandoff owners={step.owners} crewCodes={step.owners.includes("MANDOR") ? pendingCrews : undefined} />}
          {step.key === "participants" && <ShiftParticipants />}
          {step.key === "sensors" && <ShiftSensorTask deviceFigure={deviceFigure} done={step.done} progress={step.progress} />}
          {step.key === "plans" && <ShiftPlanReview />}
          {step.key === "instructions" && <ShiftInstructions />}
          {step.key === "execution" && <ShiftExecution />}
          {step.key === "finish" && <><ShiftExecution verify />{flow.verified && izin("KELOLA_SHIFT") && <div className="wizard-close" data-guide="close-task"><div className="wizard-result"><CheckCircleIcon size={20} /><div><h3>Semua tindakan sudah terverifikasi.</h3><p>Tutup shift untuk menyelesaikan siklus dan mengunci laporan akhir.</p></div></div><ConfirmAction label="Tutup shift & selesaikan" guide="close-shift" title="Tutup shift dan kunci laporan?" description="Semua tindakan sudah diverifikasi. Catatan shift menjadi hanya-baca." onConfirm={() => dispatch({ type: "TUTUP_SHIFT", shiftId: shift.id })} /></div>}</>}
        </div>
        <footer className="wizard-task-footer" data-guide="task-next">{selected > 0 ? <Button variant="outline" onClick={() => navigate(selected - 1)}><ArrowLeftIcon />Sebelumnya</Button> : <span />}{step.done && selected < flow.steps.length - 1 && <Button onClick={() => navigate(selected + 1)}>Lanjut: {flow.steps[selected + 1].title}<ArrowRightIcon /></Button>}</footer>
      </section></div>
      {canEdit && <details className="mt-8"><summary className="cursor-pointer text-sm text-muted-foreground">Pengaturan draft shift</summary><div className="mt-4 flex flex-wrap gap-2"><ShiftForm key={shift.id} shift={shift} /><ConfirmAction label="Hapus draft" disabled={!izin("KELOLA_SHIFT")} title="Hapus draft shift?" description="Data pada draft dihapus. Master pekerja tetap tersedia." onConfirm={() => dispatch({ type: "HAPUS_SHIFT", shiftId: shift.id })} /></div></details>}
    </>}
  </>
}

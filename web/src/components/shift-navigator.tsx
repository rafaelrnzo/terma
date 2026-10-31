"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowRightIcon, CheckIcon, ClockIcon, PlayIcon, ArrowLeftIcon } from "@phosphor-icons/react"
import { GuideButton } from "@/components/workflow-guide"
import { ConfirmAction } from "@/components/confirm-action"
import { Button } from "@/components/ui/button"
import { LABEL_PERAN } from "@/lib/access"
import { USERS } from "@/lib/config"
import { managedJourney, managedStages } from "@/lib/managed-journey"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { isShiftRoute } from "@/lib/navigation"
import { useApp, useIzin } from "@/lib/store"
import { cn } from "@/lib/utils"

export function ShiftProgress() {
  const { state, user } = useApp()
  if (!user || !currentShift(state)) return null
  const stages = managedStages(state, user)
  const current = stages.findIndex(stage => !stage.done)
  return <nav aria-label="Tahapan shift" data-guide="stages" className="shift-stages no-print">{stages.map((stage, index) => <Link key={stage.title} href={stage.href} aria-current={index === current ? "step" : undefined} className={cn("shift-stage", index === current && "shift-stage-current")}><span className={cn("stage-number", stage.done && "stage-done")}>{stage.done ? <CheckIcon size={14} weight="bold" /> : index + 1}</span><span><strong>{stage.title}</strong><small>{stage.done ? "Selesai" : stage.owner}</small></span></Link>)}</nav>
}

export function ShiftFocusCard({ compact = false }: { compact?: boolean }) {
  const { state, user, dispatch } = useApp()
  const izin = useIzin()
  const path = usePathname()
  const router = useRouter()
  if (!user) return null
  const { focus, command, shift, hub } = managedJourney(state, user)
  const candidates = state.demo && focus.state === "waiting" ? USERS.filter(candidate => candidate.role === focus.owner && candidate.id !== user.id && (candidate.role !== "MANDOR" || state.pekerja.some(worker => worker.reguKode === candidate.reguKode))) : []
  return <section data-guide={compact ? "handoff" : "current-step"} className={cn("shift-focus no-print", compact && "shift-focus-compact")} aria-label="Arahan kerja shift">
    <div className="shift-focus-copy"><p className="eyebrow">{focus.state === "waiting" ? <ClockIcon size={15} /> : focus.state === "complete" ? <CheckIcon size={15} /> : <PlayIcon size={15} />}{focus.state === "waiting" ? `GILIRAN ${LABEL_PERAN[focus.owner].toUpperCase()}` : focus.state === "complete" ? "SHIFT SELESAI" : compact ? "LANGKAH BERIKUTNYA" : "KERJAKAN SEKARANG"}</p><h2>{focus.title}</h2><p>{focus.description}</p>
      {candidates.length > 0 && <div className="demo-handoff"><span>Lanjutkan sebagai penanggung jawab:</span>{candidates.map(candidate => <button key={candidate.id} onClick={() => { dispatch({ type: "LOGIN", userId: candidate.id }); router.push(focus.href) }}>Sebagai {candidate.nama} · {LABEL_PERAN[candidate.role]}{candidate.reguKode ? ` ${candidate.reguKode}` : ""}<ArrowRightIcon size={12} /></button>)}</div>}
    </div><div className="shift-focus-actions">{command && shift && user.role === "HSE" ? <ConfirmAction label={focus.cta} guide={command === "TERBITKAN_SHIFT" ? "publish-shift" : "close-shift"} disabled={!izin("KELOLA_SHIFT")} title={command === "TERBITKAN_SHIFT" ? "Terbitkan shift?" : "Tutup shift dan kunci laporan?"} description={command === "TERBITKAN_SHIFT" ? "Semua rencana telah disetujui. Setelah diterbitkan, bagikan instruksi dan catat penerimaan mandor." : "Semua tindakan telah terverifikasi. Catatan shift menjadi hanya-baca setelah ditutup."} onConfirm={() => dispatch({ type: command, shiftId: shift.id })} /> : path === focus.href ? <>{shift && path !== hub && <Button asChild variant="outline"><Link href={hub}>Kembali ke alur shift</Link></Button>}<GuideButton label="Tunjukkan tugas di halaman ini" /></> : <Button asChild variant={focus.state === "waiting" ? "outline" : "default"}><Link href={focus.href}>{focus.cta}<ArrowRightIcon size={16} /></Link></Button>}</div>
  </section>
}

export function ShiftRouteContext() {
  const { state, user } = useApp()
  const path = usePathname()
  const shift = currentShift(state)
  if (!user || !shift || (!isShiftRoute(path) && path !== "/laporan")) return null
  return <div className="shift-route-context no-print"><Link href={`/shift/${shift.id}`} className="mb-3 inline-flex items-center gap-2 text-sm font-medium"><ArrowLeftIcon />{shift.nama} · {shift.tanggal}<span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span></Link><ShiftProgress /></div>
}

export function ShiftOverview() { return <div className="shift-overview"><ShiftProgress /><ShiftFocusCard /></div> }

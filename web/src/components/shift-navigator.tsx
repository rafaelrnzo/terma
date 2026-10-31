"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowRightIcon, CheckIcon, ClockIcon, PlayIcon } from "@phosphor-icons/react"
import { GuideButton } from "@/components/workflow-guide"
import { Button } from "@/components/ui/button"
import { LABEL_PERAN } from "@/lib/access"
import { USERS } from "@/lib/config"
import { shiftJourney } from "@/lib/shift-journey"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

const stages = [
  { title: "Siapkan data", owner: "Petugas data · HSE", href: "/impor", routes: ["/impor", "/paparan", "/pengukuran"] },
  { title: "Setujui rencana", owner: "HSE", href: "/rencana", routes: ["/rencana"] },
  { title: "Jalankan shift", owner: "HSE → Mandor", href: "/instruksi", routes: ["/instruksi", "/tindakan"] },
  { title: "Verifikasi & laporan", owner: "HSE", href: "/laporan", routes: ["/tindakan", "/laporan"] },
]

export function ShiftProgress() {
  const { state, user } = useApp()
  const path = usePathname()
  if (!user) return null
  const journey = shiftJourney(state, user)
  const current = path.startsWith("/pekerja/") ? 1 : path === "/ringkasan" ? journey.focus.stage - 1 : path === "/tindakan" && user.role === "HSE" ? 3 : stages.findIndex(stage => stage.routes.includes(path))
  return <nav aria-label="Tahapan shift" data-guide="stages" className="shift-stages no-print">{stages.map((stage, index) => {
    const done = index === 0 ? journey.steps.slice(0, 3).every(step => step.selesai) : index === 1 ? journey.steps[3].selesai : index === 2 ? journey.steps[4].selesai && !journey.reportPending && !journey.verifyPending && journey.verified > 0 : journey.isClosed
    const pending = journey.steps.find(step => stage.routes.includes(step.href) && !step.selesai && step.peran.includes(user.role))
    return <Link key={stage.href} href={pending?.href ?? stage.href} aria-current={index === current ? "step" : undefined} className={cn("shift-stage", index === current && "shift-stage-current")}><span className={cn("stage-number", done && "stage-done")}>{done ? <CheckIcon size={14} weight="bold" /> : index + 1}</span><span><strong>{stage.title}</strong><small>{done ? "Lengkap dalam lingkup ini" : stage.owner}</small></span>{index < 3 && <ArrowRightIcon className="stage-arrow" size={14} aria-hidden />}</Link>
  })}</nav>
}

export function ShiftFocusCard({ compact = false }: { compact?: boolean }) {
  const { state, user, dispatch } = useApp()
  const path = usePathname()
  const router = useRouter()
  if (!user) return null
  const { focus } = shiftJourney(state, user)
  const candidates = state.demo && focus.state === "waiting" ? USERS.filter(candidate => candidate.role === focus.owner && candidate.id !== user.id) : []
  return <section data-guide={compact ? "handoff" : "current-step"} className={cn("shift-focus no-print", compact && "shift-focus-compact")} aria-label={compact ? "Langkah berikutnya sesuai peran" : "Arahan kerja shift"}>
    <div className="shift-focus-copy"><p className="eyebrow">{focus.state === "waiting" ? <ClockIcon size={15} /> : focus.state === "complete" ? <CheckIcon size={15} /> : <PlayIcon size={15} />}{focus.state === "waiting" ? `GILIRAN ${LABEL_PERAN[focus.owner].toUpperCase()}` : focus.state === "complete" ? "PEKERJAAN TERKONFIRMASI" : compact ? "BERIKUTNYA UNTUK ANDA" : "MULAI DARI LANGKAH INI"}</p><h2>{focus.title}</h2><p>{focus.description}</p>
      {candidates.length > 0 && <div className="demo-handoff"><span>Coba serah terima di demo:</span>{candidates.map(candidate => <button key={candidate.id} onClick={() => { dispatch({ type: "LOGIN", userId: candidate.id }); router.push(focus.href) }}>Sebagai {candidate.nama} · {LABEL_PERAN[candidate.role]}{candidate.reguKode ? ` ${candidate.reguKode}` : ""}<ArrowRightIcon size={12} /></button>)}</div>}
    </div><div className="shift-focus-actions">{path === focus.href ? focus.state === "action" ? <GuideButton label="Tunjukkan yang perlu dikerjakan" /> : <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">{focus.state === "waiting" ? <><ClockIcon size={16} />Menunggu {LABEL_PERAN[focus.owner]}</> : <><CheckIcon size={16} />Sudah terverifikasi</>}</span> : <Button asChild variant={focus.state === "waiting" ? "outline" : "default"}><Link href={focus.href}>{focus.cta}<ArrowRightIcon size={16} /></Link></Button>}</div>
  </section>
}

export function ShiftRouteContext() {
  const { user } = useApp()
  const path = usePathname()
  if (!user || (!path.startsWith("/pekerja/") && !stages.some(stage => stage.routes.includes(path)))) return null
  return <div className="shift-route-context no-print" data-guide="current-step"><p className="shift-role">Anda sebagai <strong>{user.nama} · {LABEL_PERAN[user.role]}</strong><span>Ikuti tugas dan arahan serah terima di bawah.</span></p><ShiftProgress /></div>
}

export function ShiftOverview() {
  const { state, user } = useApp()
  if (!user) return null
  return <div className="shift-overview"><p className="shift-role">Anda sebagai <strong>{user.nama} · {LABEL_PERAN[user.role]}</strong><span>Panduan dan tindakan mengikuti peran aktif.</span></p>{state.demo && <p className="mb-3 text-xs leading-relaxed text-muted-foreground">Demo sudah berisi shift yang berjalan. Ikuti tugas yang masih menunggu peran Anda; data contoh tidak perlu diisi ulang.</p>}<ShiftProgress /><ShiftFocusCard /></div>
}

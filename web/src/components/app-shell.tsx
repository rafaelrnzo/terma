"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowRight, ClipboardCheck, ClipboardList, FileBarChart2, FileUp, LayoutDashboard, MapPin, Menu, MessageSquare, Thermometer, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { LABEL_PERAN } from "@/lib/access"
import { ATURAN_FIXTURE, LOKASI, REGU, USERS } from "@/lib/config"
import { useApp, useIzin } from "@/lib/store"
import { nextWorkflowStep, workflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"
import { WorkspaceTools } from "@/components/workspace-tools"
import { StepContext } from "@/components/shift-context"

const NAV = [
  { href: "/", label: "Ringkasan", full: "Ringkasan", icon: LayoutDashboard },
  { href: "/impor", label: "Pekerja & data", full: "Pekerja & data", icon: FileUp },
  { href: "/paparan", label: "Adaptasi", full: "Paparan & adaptasi", icon: UsersRound },
  { href: "/pengukuran", label: "WBGT", full: "Pengukuran WBGT", icon: Thermometer },
  { href: "/rencana", label: "Rencana", full: "Rencana & persetujuan", icon: ClipboardList },
  { href: "/instruksi", label: "Instruksi", full: "Instruksi mandor", icon: MessageSquare },
  { href: "/tindakan", label: "Tindakan", full: "Tindakan & verifikasi", icon: ClipboardCheck },
  { href: "/laporan", label: "Laporan", full: "Laporan & audit", icon: FileBarChart2 },
]

function Navigation({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const path = usePathname()
  const { state, user } = useApp()
  const steps = user ? workflow(state, user) : []
  return (
    <nav aria-label="Alur kerja" className={mobile ? "grid gap-1 overflow-y-auto p-4" : "hidden items-center gap-1 xl:flex"}>
      {NAV.map((item) => {
        const active = item.href === "/" ? path === "/" : path.startsWith(item.href)
        const step = steps.find((s) => s.href === item.href)
        return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={item.full} className={cn("nav-item", active && "nav-item-active", mobile && "gap-3 px-4")}>
          {mobile && <item.icon className="size-4 shrink-0" aria-hidden />}
          <span>{mobile ? item.full : item.label}</span>
          {mobile && step && <span className="ml-auto text-xs text-muted-foreground">{step.no}/7</span>}
        </Link>
      })}
    </nav>
  )
}

function Brand() {
  return <Link href="/" className="inline-flex shrink-0 items-center gap-3 rounded-md" aria-label="TERMA — Ringkasan">
    <span className="brand-symbol"><Thermometer className="size-6" strokeWidth={1.6} aria-hidden /></span>
    <span><span className="block font-heading text-xl font-semibold tracking-tight">terma<span className="text-primary">.</span></span><span className="hidden text-xs text-muted-foreground sm:block">Paparan panas kerja</span></span>
  </Link>
}

function UserSelect({ mobile = false }: { mobile?: boolean }) {
  const { user, dispatch } = useApp()
  const id = mobile ? "pengguna-mobile" : "pengguna"
  return <div className={mobile ? "min-w-0 sm:hidden" : "hidden sm:block"}>
    <label htmlFor={id} className="sr-only">Pengguna</label>
    <Select value={user?.id} onValueChange={(v) => dispatch({ type: "LOGIN", userId: v })}>
      <SelectTrigger id={id} className={mobile ? "w-full bg-card" : "w-48 border-transparent bg-card"}><SelectValue /></SelectTrigger>
      <SelectContent position="popper">{USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.nama} · {LABEL_PERAN[u.role]}{u.reguKode ? " " + REGU.find((g) => g.kode === u.reguKode)?.nama : ""}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, dispatch, user, ready, storageError, retryStorage } = useApp()
  const izin = useIzin()
  const path = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const n = state.notice
    if (!n) return
    if (n.tipe === "error") toast.error(n.pesan)
    else if (n.tipe === "ok") toast.success(n.pesan)
    else toast.info(n.pesan)
  }, [state.notice])
  if (!ready) return <p role="status" className="p-8 text-muted-foreground">Memuat ruang kerja TERMA…</p>
  const step = user ? workflow(state, user).find((s) => path.startsWith(s.href)) ?? nextWorkflowStep(state, user) : undefined
  return (
    <div className="app-frame">
      <a href="#konten-utama" className="skip-link no-print">Lewati navigasi ke konten utama</a>
      <header className="app-header no-print">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <Brand />
          <div className="flex min-w-0 items-center gap-2">
            <WorkspaceTools />
            <UserSelect />
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild><Button variant="secondary" size="icon" aria-label="Buka navigasi" className="xl:hidden"><Menu /></Button></DialogTrigger>
              <DialogContent className="left-0 top-0 flex h-dvh max-h-dvh w-[calc(100%-2rem)] max-w-80 translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-80 data-open:zoom-in-100 data-closed:zoom-out-100">
                <DialogHeader className="shrink-0 border-b p-6 pr-16"><DialogTitle>TERMA</DialogTitle><DialogDescription>Ruang kerja paparan panas</DialogDescription></DialogHeader>
                <Navigation mobile onNavigate={() => setMenuOpen(false)} />
                {step && <div className="mt-auto border-t p-6"><p className="text-sm font-medium">{step.label}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.progress}</p></div>}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="mt-4"><Navigation /></div>
        <div className="context-bar">
          <p className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><MapPin className="size-3.5" aria-hidden />{LOKASI}<span className="mx-2 text-border">/</span>{NAV.find((n) => n.href === path)?.full ?? (path === "/panduan" ? "Panduan" : path.startsWith("/pekerja") ? "Detail pekerja" : "Detail regu")}</p>
          <UserSelect mobile />
          <div className="flex min-w-0 items-center gap-3">
            <label htmlFor="tanggal" className="hidden text-xs text-muted-foreground sm:block">Tanggal rencana</label>
            <Input id="tanggal" type="date" className="w-full bg-card sm:w-44" value={state.tanggal} disabled={!izin("ATUR_TANGGAL")} onChange={(e) => e.target.value && dispatch({ type: "SET_TANGGAL", tanggal: e.target.value })} aria-label="Tanggal rencana" />
          </div>
        </div>
      </header>
      <main id="konten-utama" tabIndex={-1} className="app-main outline-none">
        {state.demo && <div className="demo-notice" role="note"><span className="font-semibold">Ruang demo · seluruh data simulasi</span><span>Perubahan tersimpan di browser ini. Bukan untuk keputusan operasional.</span><Link className="ml-auto inline-flex min-h-8 items-center gap-2 font-medium underline underline-offset-4" href="/panduan">Tentang demo<ArrowRight className="size-3" aria-hidden /></Link></div>}
        {storageError && <div role="alert" className="mb-6 rounded-md border border-destructive p-4 text-sm"><p>{storageError}</p><Button className="mt-3" variant="outline" onClick={retryStorage}>Coba simpan lagi</Button></div>}
        {state.demo && state.tanggal !== state.demo.tanggal && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-secondary p-4 text-sm"><p>Contoh data tersedia pada {state.demo.tanggal}. Tanggal ini dapat belum memiliki bacaan atau rencana.</p><Button variant="outline" disabled={!izin("ATUR_TANGGAL")} onClick={() => dispatch({ type: "SET_TANGGAL", tanggal: state.demo!.tanggal })}>Kembali ke tanggal demo</Button></div>}
        {children}
      </main>
      <footer className="no-print app-footer"><span>{LOKASI} · Simulasi lokal</span><Link className="underline underline-offset-4" href="/panduan">Panduan & batas penggunaan</Link><span>Aturan {ATURAN_FIXTURE.versi}{ATURAN_FIXTURE.isFixture && " · belum disahkan HSE"}</span></footer>
      <Toaster position="bottom-right" />
    </div>
  )
}

export function PageHeader({ no, title, children, peran, summary }: { no?: string; title: string; children?: ReactNode; peran?: string; summary?: string }) {
  return <div className="page-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1>{title}</h1>{no && <span className="step-label">Langkah {no} / 7</span>}</div>
    {summary && <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">{summary}</p>}
    {children && (summary ? <Accordion type="single" collapsible className="mt-1 max-w-prose"><AccordionItem value="panduan"><AccordionTrigger className="justify-start gap-2 text-muted-foreground **:data-[slot=accordion-trigger-icon]:ml-0">Panduan{peran ? " · " + peran : " langkah ini"}</AccordionTrigger><AccordionContent className="pt-1 text-base text-muted-foreground">{children}</AccordionContent></AccordionItem></Accordion> : <div className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">{children}</div>)}
    {no && <StepContext />}
  </div>
}

export function NextStep({ href, label }: { href: string; label: string }) {
  return <div className="no-print mt-8 flex justify-end border-t pt-6"><Button asChild variant="outline"><Link href={href}>Lanjut: {label}<ArrowRight aria-hidden /></Link></Button></div>
}

export function WorkflowEmpty({ title, children, href, label }: { title: string; children: ReactNode; href: string; label: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription className="max-w-prose text-base leading-relaxed">{children}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={href}>{label}<ArrowRight aria-hidden /></Link></Button></CardContent></Card>
}

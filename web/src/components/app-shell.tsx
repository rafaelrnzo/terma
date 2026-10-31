"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowRightIcon as ArrowRight, ListIcon as Menu, BookOpenIcon as BookOpen, ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react"
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
import { Navigation } from "@/components/workspace-navigation"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { ThemeToggle } from "@/components/ui-provider"
import { WorkspaceTools } from "@/components/workspace-tools"
import { StepContext } from "@/components/shift-context"
import { Wordmark } from "@/components/wordmark"
import { navigationGroup } from "@/lib/navigation"

function UserSelect({ mobile = false }: { mobile?: boolean }) {
  const { user, dispatch } = useApp()
  const id = mobile ? "pengguna-mobile" : "pengguna"
  return <div data-tour={mobile ? "role-mobile" : "role"} className={mobile ? "min-w-0 sm:hidden" : "hidden sm:block"}>
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
  // The introduction is readable without entering the operational workspace or waiting for storage.
  if (path === "/") return <>{children}</>
  const step = user ? workflow(state, user).find((s) => path.startsWith(s.href)) ?? nextWorkflowStep(state, user) : undefined
  const group = navigationGroup(path)
  return (
    <div className="app-frame">
      <a href="#konten-utama" className="skip-link no-print">Lewati navigasi ke konten utama</a>
      <aside className="app-sidebar no-print" aria-label="Navigasi ruang kerja" data-tour="navigation">
        <div className="sidebar-brand"><Wordmark /><p>THERMAL & RENAL MONITORING</p></div><div className="sidebar-site"><span className="site-avatar">K</span><span><strong>Lokasi konstruksi</strong><small>Workspace demo · Indonesia</small></span></div><p className="nav-section-label">RUANG KERJA</p>
        <Navigation />
        <div className="sidebar-support"><Link href="/panduan" className="nav-item gap-3" aria-current={path === "/panduan" ? "page" : undefined}><BookOpen className="size-4" aria-hidden />Panduan penggunaan</Link><Link href="/" className="nav-item gap-3"><ArrowUpRight className="size-4" aria-hidden />Tentang TERMA</Link><p>Mode simulasi<br /><span>Data contoh, bukan pemantauan langsung.</span></p></div>
      </aside>
      <div className="app-workspace">
      <header className="app-header no-print" data-page-chrome>
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="lg:hidden"><Wordmark /></div>
          <p className="workspace-breadcrumb hidden text-sm lg:flex"><span>{LOKASI}</span><span aria-hidden>/</span><span className="font-semibold text-foreground">{group?.label ?? "Ruang kerja"}</span></p>
          <div className="flex min-w-0 items-center gap-2">
            <WorkspaceTools /><ThemeToggle />
            <UserSelect />
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild><Button variant="secondary" size="icon" aria-label="Buka navigasi" className="lg:hidden" data-tour="navigation-mobile"><Menu /></Button></DialogTrigger>
              <DialogContent className="left-0 top-0 flex h-dvh max-h-dvh w-[calc(100%-2rem)] max-w-80 translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-80 data-open:zoom-in-100 data-closed:zoom-out-100">
                <DialogHeader className="shrink-0 border-b p-6 pr-16"><DialogTitle>TERMA</DialogTitle><DialogDescription>Ruang kerja paparan panas</DialogDescription></DialogHeader>
                <Navigation mobile onNavigate={() => setMenuOpen(false)} />
                <Link href="/panduan" onClick={() => setMenuOpen(false)} className="mx-4 nav-item">Panduan penggunaan</Link>
                {step && <div className="mt-auto border-t p-6"><p className="text-sm font-medium">{step.label}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.progress}</p></div>}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="context-bar">
          <p className="hidden text-sm text-muted-foreground sm:block">{group?.label ?? "Ruang kerja"} <span aria-hidden> / </span> {LABEL_PERAN[user?.role ?? "HSE"]}</p>
          <UserSelect mobile />
          <div className="flex min-w-0 items-center gap-3">
            <label htmlFor="tanggal" className="hidden text-xs text-muted-foreground sm:block">Tanggal rencana</label>
            <Input id="tanggal" type="date" className="w-full bg-card sm:w-44" value={state.tanggal} disabled={!izin("ATUR_TANGGAL")} onChange={(e) => e.target.value && dispatch({ type: "SET_TANGGAL", tanggal: e.target.value })} aria-label="Tanggal rencana" />
          </div>
        </div>
      </header>
      <main id="konten-utama" tabIndex={-1} className="app-main outline-none">
        {state.demo && <p className="workspace-demo-note" role="note">Data simulasi · bukan untuk keputusan operasional. <Link className="underline underline-offset-4" href="/panduan">Tentang demo</Link></p>}
        {group && group.routes.length > 1 && <nav aria-label={group.label} className="no-print mb-6 flex flex-wrap gap-2 border-b pb-3 lg:hidden">{group.routes.map(route => <Link key={route.href} href={route.href} aria-current={path === route.href ? "page" : undefined} className={cn("nav-item", path === route.href && "nav-item-active")}>{route.label}</Link>)}</nav>}
        {storageError && <div role="alert" className="mb-6 rounded-md border border-destructive p-4 text-sm"><p>{storageError}</p><Button className="mt-3" variant="outline" onClick={retryStorage}>Coba simpan lagi</Button></div>}
        {state.demo && state.tanggal !== state.demo.tanggal && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-secondary p-4 text-sm"><p>Contoh data tersedia pada {state.demo.tanggal}. Tanggal ini dapat belum memiliki bacaan atau rencana.</p><Button variant="outline" disabled={!izin("ATUR_TANGGAL")} onClick={() => dispatch({ type: "SET_TANGGAL", tanggal: state.demo!.tanggal })}>Kembali ke tanggal demo</Button></div>}
        <div key={path} className="page-enter">{ready ? children : <DashboardSkeleton />}</div>
      </main>
      <footer className="no-print app-footer"><Link className="underline underline-offset-4" href="/">Tentang TERMA</Link><Link className="underline underline-offset-4" href="/panduan">Panduan & batas penggunaan</Link><span>Aturan {ATURAN_FIXTURE.versi}{ATURAN_FIXTURE.isFixture && " · belum disahkan HSE"}</span></footer>
      </div>
      <Toaster position="bottom-right" />
    </div>
  )
}

export function PageHeader({ no, title, children, peran, summary }: { no?: string; title: string; children?: ReactNode; peran?: string; summary?: string }) {
  return <div className="page-heading">
    <h1>{title}</h1>
    {summary && <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">{summary}</p>}
    {children && (summary ? <Accordion type="single" collapsible className="mt-1 max-w-prose"><AccordionItem value="panduan"><AccordionTrigger className="justify-start gap-2 text-sm text-muted-foreground **:data-[slot=accordion-trigger-icon]:ml-0">Cara kerja{peran ? " · " + peran : " halaman ini"}</AccordionTrigger><AccordionContent className="pt-1 text-sm leading-relaxed text-muted-foreground">{children}</AccordionContent></AccordionItem></Accordion> : <div className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">{children}</div>)}
    {no && <StepContext />}
  </div>
}

export function NextStep({ href, label }: { href: string; label: string }) {
  return <div className="no-print mt-8 flex justify-end border-t pt-6"><Button asChild variant="outline"><Link href={href}>Lanjut: {label}<ArrowRight aria-hidden /></Link></Button></div>
}

export function WorkflowEmpty({ title, children, href, label }: { title: string; children: ReactNode; href: string; label: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription className="max-w-prose text-base leading-relaxed">{children}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={href}>{label}<ArrowRight aria-hidden /></Link></Button></CardContent></Card>
}

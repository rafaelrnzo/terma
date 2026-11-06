"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { ListIcon as Menu } from "@phosphor-icons/react/dist/csr/List"
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { LABEL_PERAN } from "@/lib/access"
import { LOKASI, REGU, USERS } from "@/lib/config"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Navigation } from "@/components/workspace-navigation"
import { ShiftRouteContext } from "@/components/shift-navigator"
import { RouteLoading } from "@/components/route-loading"
import { ThemeToggle } from "@/components/ui-provider"
import { WorkspaceTools } from "@/components/workspace-tools"
import { StepContext } from "@/components/shift-context"
import { Wordmark } from "@/components/wordmark"
import { navigationGroup, isShiftRoute, roleHomePath, pageAllowedFor } from "@/lib/navigation"
import { currentShift } from "@/lib/management-state"

function UserSelect({ mobile = false }: { mobile?: boolean }) {
  const { user, dispatch } = useApp()
  const router = useRouter()
  const path = usePathname()
  const id = mobile ? "pengguna-mobile" : "pengguna"
  const crew = REGU.find(row => row.kode === user?.reguKode)
  return <div data-tour={mobile ? "role-mobile" : "role"} className={mobile ? "min-w-0 sm:hidden" : "hidden sm:block"}>
    <label htmlFor={id} className="sr-only">Ganti akun</label>
    <Select value={user?.id} onValueChange={(v) => {
      if (v === user?.id) return
      dispatch({ type: "LOGIN", userId: v })
      const next = USERS.find(person => person.id === v)
      if (next && !pageAllowedFor(next,path)) router.push(roleHomePath(next))
      if (next) toast.success(`Akun aktif: ${next.nama} · ${LABEL_PERAN[next.role]}`)
    }}>
      <SelectTrigger id={id} className="account-trigger"><SelectValue>{user && <span className="account-identity"><span className="account-avatar" aria-hidden>{user.nama.slice(0, 1)}</span><span><strong>{user.nama}</strong><small>{LABEL_PERAN[user.role]}{crew ? ` · ${crew.nama}` : " · Seluruh lokasi"}</small></span></span>}</SelectValue></SelectTrigger>
      <SelectContent position="popper">{USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.nama} · {LABEL_PERAN[u.role]}{u.reguKode ? " " + REGU.find((g) => g.kode === u.reguKode)?.nama : ""}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, user, ready, storageError, retryStorage } = useApp()
  const path = usePathname()
  const activeShift = currentShift(state)
  const shift = activeShift && (user?.role !== "MANDOR" || activeShift.workspace.pekerja.some(worker => worker.reguKode === user.reguKode)) ? activeShift : undefined
  const needsShift = isShiftRoute(path) || ["/laporan", "/analitik", "/insight", "/monitoring", "/absensi", "/band"].includes(path)
  const blockedExecution = shift?.status === "DRAFT" && ["/instruksi", "/tindakan"].includes(path)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const n = state.notice
    if (!n) return
    if (n.tipe === "error") toast.error(n.pesan)
    else if (n.tipe === "ok") toast.success(n.pesan)
    else toast.info(n.pesan)
  }, [state.notice])
  // The introduction is readable without entering the operational workspace or waiting for storage.
  if (path === "/" || path === "/kiosk") return <>{children}</>
  const group = navigationGroup(path)
  return (
    <div className="app-frame">
      <a href="#konten-utama" className="skip-link no-print">Lewati navigasi ke konten utama</a>
      <aside className="app-sidebar no-print" aria-label="Navigasi ruang kerja" data-tour="navigation">
        <div className="sidebar-brand"><Wordmark /></div><div className="sidebar-site"><span className="site-avatar">K</span><span><strong>Lokasi konstruksi</strong><small>Lokasi 1 · Indonesia</small></span></div><p className="nav-section-label">{user ? `${LABEL_PERAN[user.role]}${user.reguKode ? ` · ${REGU.find(crew => crew.kode === user.reguKode)?.nama}` : " · SELURUH LOKASI"}` : "RUANG KERJA"}</p>
        <Navigation />
        <div className="sidebar-support"><Link href="/" className="nav-item gap-3"><ArrowUpRight className="size-4" aria-hidden />Tentang TERMA</Link></div>
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

              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="context-bar">

          <UserSelect mobile />
          <div className="flex min-w-0 items-center gap-3">
            <Link href={user?.role === "KLINIK" ? "/klinik" : shift ? `/shift/${shift.id}` : "/ringkasan"} className="text-sm font-medium underline-offset-4 hover:underline">{shift ? `${shift.nama} · ${shift.tanggal}` : "Pilih shift"}</Link>
          </div>
        </div>
      </header>
      <main id="konten-utama" tabIndex={-1} className="app-main outline-none">
        {group && group.routes.length > 1 && <nav aria-label={group.label} className="no-print mb-6 flex flex-wrap gap-2 border-b pb-3 lg:hidden">{group.routes.filter(route=>!user || pageAllowedFor(user,route.href)).map(route => <Link key={route.href} href={route.href} aria-current={path === route.href ? "page" : undefined} className={cn("nav-item", path === route.href && "nav-item-active")}>{route.label}</Link>)}</nav>}
        {storageError && <div role="alert" className="mb-6 rounded-md border border-destructive p-4 text-sm"><p>{storageError}</p><Button className="mt-3" variant="outline" onClick={retryStorage}>Coba simpan lagi</Button></div>}
        {ready && <ShiftRouteContext />}
        <div key={`${path}:${user?.id}`} className="page-enter">{ready ? user && !pageAllowedFor(user, path) ? <WorkflowEmpty title="Tidak punya akses" href={roleHomePath(user)} label="Kembali ke ruang kerja">Halaman ini tersedia untuk peran yang berwenang. Akun Anda tetap {user.nama} · {LABEL_PERAN[user.role]}.</WorkflowEmpty> : needsShift && !shift ? <WorkflowEmpty title="Buka shift terlebih dahulu" href="/ringkasan" label="Ke daftar shift">Pilih shift yang ingin dikerjakan.</WorkflowEmpty> : blockedExecution ? <WorkflowEmpty title="Terbitkan shift sebelum pelaksanaan" href={user?.role === "HSE" ? "/rencana" : roleHomePath(user!)} label="Lihat rencana shift">Selesaikan persetujuan rencana, lalu terbitkan shift.</WorkflowEmpty> : <>{shift?.status === "CLOSED" && needsShift && <p role="status" className="mb-5 rounded-md border bg-secondary p-4 text-sm">Shift sudah ditutup. Catatan berikut hanya dapat dibaca.</p>}{children}</> : <RouteLoading />}</div>
      </main>

      </div>
      <Toaster position="bottom-right" />
    </div>
  )
}

export function PageHeader({ context, title, summary }: { context?: boolean; title: string; summary?: string }) {
  return <div className="page-heading" data-guide="page-heading">
    <h1>{title}</h1>
    {summary && <p className="page-subtitle">{summary}</p>}
    {context && <StepContext />}
  </div>
}

export function WorkflowEmpty({ title, children, href, label }: { title: string; children: ReactNode; href: string; label: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription className="max-w-prose text-base leading-relaxed">{children}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={href}>{label}<ArrowRight aria-hidden /></Link></Button></CardContent></Card>
}

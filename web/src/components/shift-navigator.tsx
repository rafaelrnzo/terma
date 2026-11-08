"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { isShiftRoute, NAV_GROUPS } from "@/lib/navigation"
import { useApp } from "@/lib/store"

/** Breadcrumb for shift pages: shift summary / module / current page (one trail instead of stacked back links). */
export function ShiftRouteContext() {
  const { state,user }=useApp()
  const path=usePathname()
  const shift=currentShift(state)
  if(!user || !shift || (!isShiftRoute(path) && path!=="/laporan"))return null
  const detail=path.startsWith("/pekerja/") || path.startsWith("/regu/")
  const code=detail ? decodeURIComponent(path.split("/")[2] ?? "") : ""
  const parent=detail ? (user.role==="MANDOR" ? { href:"/instruksi", label:"Instruksi regu" } : { href:"/rencana", label:"Perencanaan shift" }) : undefined
  const current=path.startsWith("/pekerja/") ? state.pekerja.find(worker=>worker.kode===code)?.nama ?? code : path.startsWith("/regu/") ? `Regu ${code}` : NAV_GROUPS.flatMap(group=>group.routes).find(route=>route.href===path)?.label
  const link="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
  return <nav aria-label="Breadcrumb" className="shift-route-context no-print"><ol className="mb-3 flex flex-wrap items-center gap-2 text-sm">
    <li><Link href={`/shift/${shift.id}`} className={`inline-flex flex-wrap items-center gap-2 ${link}`}>Ringkasan {shift.nama}<span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span></Link></li>
    {parent && <><li aria-hidden className="text-muted-foreground">/</li><li><Link href={parent.href} className={link}>{parent.label}</Link></li></>}
    {current && <><li aria-hidden className="text-muted-foreground">/</li><li aria-current="page" className="font-medium">{current}</li></>}
  </ol></nav>
}

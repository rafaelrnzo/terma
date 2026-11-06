"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { isShiftRoute } from "@/lib/navigation"
import { useApp } from "@/lib/store"

export function ShiftRouteContext() {
  const { state,user }=useApp()
  const path=usePathname()
  const shift=currentShift(state)
  if(!user || !shift || (!isShiftRoute(path) && path!=="/laporan"))return null
  return <div className="shift-route-context no-print"><Link href={`/shift/${shift.id}`} className="mb-3 inline-flex flex-wrap items-center gap-2 text-sm font-medium"><ArrowLeftIcon />Ringkasan {shift.nama}<span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span></Link></div>
}

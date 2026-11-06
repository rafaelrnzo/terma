"use client"

import Link from "next/link"
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight"
import { useApp } from "@/lib/store"
import { managementOf } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { JAM_SHIFT } from "@/lib/config"
import type { ShiftRecord } from "@/lib/management-types"

export function RoleTaskBoard({ shift, workerCount }: { shift?: ShiftRecord; workerCount: number }) {
  const { state, user } = useApp()
  if (!user) return null
  const flow = shift ? shiftTaskFlow({ ...state, ...shift.workspace, tanggal: shift.tanggal, management: { ...managementOf(state), activeId: shift.id } }, user) : null
  const zones = new Set(shift?.workspace.penugasan.map(assignment => assignment.zonaKode))
  const readings = shift?.workspace.bacaan.filter(reading => reading.tanggal === shift.tanggal && zones.has(reading.zonaKode)).length ?? 0
  const tasks = user.role === "PETUGAS_DATA" ? [
    { title: "Pekerja aktif", count: workerCount, unit: "pekerja", href: "/impor" },
    ...(shift ? [{ title: "Bacaan WBGT", count: readings, unit: `/ ${zones.size * JAM_SHIFT.length} interval`, href: "/pengukuran" },{ title: "Check-in", count: shift.readiness?.checkins.length ?? 0, unit: `/ ${shift.workspace.pekerja.length} pekerja`, href: "/absensi" }] : []),
  ] : !shift ? [] : user.role === "MANDOR" ? [
    { title: "Instruksi masuk", count: flow?.actions.filter(action => action.status === "DISAMPAIKAN").length ?? 0, unit: "menunggu pengakuan", href: "/instruksi" },
    { title: "Perlu dilaporkan", count: flow?.actions.filter(action => action.status === "DIAKUI" || action.status === "BELUM_SELESAI").length ?? 0, unit: "tindakan", href: "/tindakan" },
    { title: "Menunggu HSE", count: flow?.actions.filter(action => action.status === "TINDAKAN_DILAPORKAN").length ?? 0, unit: "laporan", href: "/tindakan" },
  ] : [
    ...(shift.workspace.konfirmasi.length < shift.workspace.pekerja.length ? [{title:"Konfirmasi adaptasi",count:shift.workspace.pekerja.length-shift.workspace.konfirmasi.length,unit:"pekerja belum dikonfirmasi",href:"/paparan"}] : []),
    { title: "Tinjau rencana", count: flow?.plans.filter(plan => !plan.disetujuiOleh).length ?? 0, unit: "belum disetujui", href: "/rencana" },
    { title: "Verifikasi laporan", count: flow?.actions.filter(action => action.status === "TINDAKAN_DILAPORKAN").length ?? 0, unit: "menunggu tinjauan", href: "/tindakan" },
  ]
  if (!tasks.length) return null
  return <section className="work-queue" aria-label="Daftar kerja"><div className="section-title-row"><h2>{user.role === "PETUGAS_DATA" ? "Persiapan data" : "Perlu ditindaklanjuti"}</h2>{shift && <span>{shift.nama}</span>}</div><div className="work-queue-grid" data-count={tasks.length}>{tasks.map(task => <Link href={task.href} key={task.title} className="summon-panel work-queue-card"><span>{task.title}<ArrowUpRightIcon size={18} /></span><strong>{task.count}</strong><small>{task.unit}</small></Link>)}</div></section>
}

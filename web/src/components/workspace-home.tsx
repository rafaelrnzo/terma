"use client"

import Link from "next/link"
import { ArrowRightIcon, CalendarBlankIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { ShiftForm } from "@/components/shift-form"
import { GuideButton } from "@/components/workflow-guide"
import { RoleStart } from "@/components/role-start"
import { RoleTaskBoard } from "@/components/role-task-board"
import { WorkflowOverview } from "@/components/workflow-overview"
import { managementOf, shiftLabel } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"
import { lingkupPekerja } from "@/lib/access"
import { REGU } from "@/lib/config"
import { ROLE_WORKSPACE } from "@/lib/navigation"

export default function ShiftListPage() {
  const { state, user, dispatch } = useApp()
  if (!user) return null
  const management = managementOf(state)
  const workers = lingkupPekerja(user, management.workers).filter(worker => !worker.diarsipkan)
  const shifts = management.shifts.filter(shift => user.role !== "MANDOR" || shift.workspace.pekerja.some(worker => worker.reguKode === user.reguKode)).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
  const ongoing = shifts.find(shift => shift.id === management.activeId && shift.status !== "CLOSED") ?? shifts.find(shift => shift.status !== "CLOSED")
  const persona = ROLE_WORKSPACE[user.role]
  const crew = REGU.find(row => row.kode === user.reguKode)
  return <>
    <div className="role-heading"><div><p className="eyebrow">{user.nama.toLocaleUpperCase("id-ID")} · {crew?.nama ?? "SELURUH LOKASI"}</p><PageHeader title={persona.title} summary={persona.purpose} /></div><GuideButton label="Panduan alur" /></div>
    <RoleStart ongoing={ongoing} workerCount={workers.length} />
    <div className="role-metrics" aria-label="Ringkasan ruang kerja"><div><span>{user.role === "MANDOR" ? "Pekerja regu Anda" : "Pekerja aktif"}</span><strong>{workers.length}</strong></div><div><span>Shift disiapkan</span><strong>{shifts.filter(shift => shift.status === "DRAFT").length}</strong></div><div><span>Shift berjalan</span><strong>{shifts.filter(shift => shift.status === "ACTIVE").length}</strong></div><div><span>Shift selesai</span><strong>{shifts.filter(shift => shift.status === "CLOSED").length}</strong></div></div>
    <RoleTaskBoard shift={ongoing} workerCount={workers.length} />
    {user.role === "HSE" && <details className="my-6"><summary className="cursor-pointer text-sm text-muted-foreground">Lihat urutan satu hari dengan TERMA</summary><div className="mt-4"><WorkflowOverview shift={ongoing ?? shifts.find(shift => shift.id === management.activeId)} /></div></details>}
    <section className="summon-panel" data-guide="shift-list"><div className="panel-heading"><h2>{user.role === "MANDOR" ? "Shift regu Anda" : "Daftar shift"} <span className="text-muted-foreground">({shifts.length})</span></h2><CalendarBlankIcon size={20} /></div><div className="divide-y">{shifts.map(shift => <article key={shift.id} className="shift-list-row"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{shift.nama}</h3><span className="shift-status" data-status={shift.status}>{shift.status === "CLOSED" && <CheckCircleIcon size={13} />}{shiftLabel(shift.status)}</span></div><p className="mt-2 text-sm text-muted-foreground">{tanggalLabel(shift.tanggal)} · {lingkupPekerja(user, shift.workspace.pekerja).length} peserta{user.role === "MANDOR" && ` · ${crew?.nama}`}</p><p className="mt-1 text-xs text-muted-foreground">{shift.status === "DRAFT" ? "Persiapan data dan persetujuan HSE" : shift.status === "ACTIVE" ? "Instruksi, pelaksanaan mandor, dan verifikasi HSE" : `Laporan akhir · ditutup ${shift.ditutupOleh ?? "HSE"}`}</p></div><Button asChild variant="outline"><Link href={`/shift/${shift.id}`} onClick={() => dispatch({ type: "BUKA_SHIFT", shiftId: shift.id })}>{shift.status === "CLOSED" ? "Lihat hasil shift" : "Buka shift"}<ArrowRightIcon /></Link></Button></article>)}</div>{!shifts.length && <div className="p-6"><h3 className="font-medium">Belum ada shift{user.role === "MANDOR" ? " untuk regu Anda" : ""}</h3><p className="mt-2 text-sm text-muted-foreground">{user.role === "HSE" ? "Tambahkan pekerja, lalu buat draft shift melalui tombol di atas." : "HSE membuat shift dan menetapkan peserta. Shift akan muncul setelah disiapkan."}</p></div>}</section>
    {ongoing && user.role === "HSE" && <details className="mt-6"><summary className="cursor-pointer text-sm text-muted-foreground">Buat shift lain</summary><div className="mt-3"><ShiftForm /></div></details>}
  </>
}

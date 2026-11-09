"use client"

import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { ShiftForm } from "@/components/shift-form"
import { RoleTaskBoard } from "@/components/role-task-board"
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
    <div className="page-title-row"><PageHeader title={user.role === "HSE" ? "Beranda shift" : persona.title} summary={crew?.nama ?? "Lokasi konstruksi · Lokasi 1"} /><div className="flex flex-wrap gap-2">{(user.role === "HSE" || user.role === "ADMIN") && <ShiftForm />}{ongoing && <Button asChild variant="outline"><Link href={`/shift/${ongoing.id}`} onClick={()=>dispatch({type:"BUKA_SHIFT",shiftId:ongoing.id})}>Ringkasan {ongoing.nama}<ArrowRightIcon /></Link></Button>}</div></div>
    {user.role === "ADMIN" && <section className="summon-panel p-5" aria-label="Akses admin"><h2 className="font-heading text-lg font-semibold">Akses seluruh modul</h2><p className="mt-1 text-sm text-muted-foreground">Pantau operasional, data pekerja, laporan, dan tindak lanjut Klinik dari satu akun.</p><div className="mt-4 flex flex-wrap gap-2">{[["Pekerja & data", "/impor"], ["Absensi", "/monitoring?tab=absensi"], ["Klinik", "/klinik"], ["Laporan", "/laporan"], ["Kios absensi", "/kiosk"]].map(([label, href]) => <Button key={href} asChild variant="outline"><Link href={href}>{label}<ArrowRightIcon /></Link></Button>)}</div></section>}
    <div className="role-metrics" aria-label="Ringkasan ruang kerja"><div><span>{user.role === "MANDOR" ? "Pekerja regu Anda" : "Pekerja aktif"}</span><strong>{workers.length}</strong></div><div><span>Shift disiapkan</span><strong>{shifts.filter(shift => shift.status === "DRAFT").length}</strong></div><div><span>Shift berjalan</span><strong>{shifts.filter(shift => shift.status === "ACTIVE").length}</strong></div><div><span>Shift selesai</span><strong>{shifts.filter(shift => shift.status === "CLOSED").length}</strong></div></div>
    <RoleTaskBoard shift={ongoing} workerCount={workers.length} />
    <section className="summon-panel" data-guide="shift-list"><div className="panel-heading"><h2>{user.role === "MANDOR" ? "Shift regu Anda" : "Daftar shift"} <span className="text-muted-foreground">({shifts.length})</span></h2><CalendarBlankIcon size={20} /></div><div className="divide-y">{shifts.map(shift => <article key={shift.id} className="shift-list-row"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{shift.nama}</h3><span className="shift-status" data-status={shift.status}>{shift.status === "CLOSED" && <CheckCircleIcon size={13} />}{shiftLabel(shift.status)}</span></div><p className="mt-2 text-sm text-muted-foreground">{tanggalLabel(shift.tanggal)} · {lingkupPekerja(user, shift.workspace.pekerja).length} peserta{user.role === "MANDOR" && ` · ${crew?.nama}`}</p></div><Button asChild variant="outline"><Link href={`/shift/${shift.id}`} onClick={() => dispatch({ type: "BUKA_SHIFT", shiftId: shift.id })}>{shift.status === "CLOSED" ? "Lihat hasil shift" : "Buka shift"}<ArrowRightIcon /></Link></Button></article>)}</div>{!shifts.length && <div className="p-6"><h3 className="font-medium">Belum ada shift{user.role === "MANDOR" ? " untuk regu Anda" : ""}</h3><p className="mt-2 text-sm text-muted-foreground">{user.role === "HSE" ? "Buat shift untuk menjadwalkan pekerja." : "Menunggu penjadwalan HSE."}</p></div>}</section>
  </>
}

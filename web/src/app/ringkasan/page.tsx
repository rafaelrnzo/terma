"use client"

import Link from "next/link"
import { ArrowRightIcon, CalendarBlankIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { ShiftForm } from "@/components/shift-form"
import { GuideButton } from "@/components/workflow-guide"
import { managementOf, shiftLabel } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

export default function ShiftListPage() {
  const { state, user, dispatch } = useApp()
  if (!user) return null
  const management = managementOf(state)
  const workers = management.workers.filter(worker => !worker.diarsipkan)
  const shifts = management.shifts.filter(shift => user.role !== "MANDOR" || shift.workspace.pekerja.some(worker => worker.reguKode === user.reguKode)).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))
  const ongoing = shifts.find(shift => shift.id === management.activeId && shift.status !== "CLOSED") ?? shifts.find(shift => shift.status !== "CLOSED")
  const nextTask = ongoing?.id === management.activeId ? shiftTaskFlow(state,user) : null
  return <>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHeader title="Shift kerja" summary="Mulai dari data pekerja, jalankan satu shift, lalu akhiri dengan laporan yang sudah ditutup." /><GuideButton label="Panduan alur" /></div>
    <section className="workflow-start summon-panel mb-6" data-guide="workflow-start"><div><p className="eyebrow">MULAI DI SINI</p><h2>{!workers.length ? "Tambahkan pekerja pertama" : ongoing ? `Lanjutkan ${ongoing.nama}` : "Buat shift dan pilih peserta"}</h2><p>{!workers.length ? "Simpan identitas, regu, tugas, dan zona awal. Data pekerja dapat dipakai kembali di shift berikutnya." : !shifts.length ? "Buat draft untuk satu tanggal. Setelah itu siapkan data, setujui rencana, dan lanjutkan pekerjaan dari halaman shift." : ongoing ? `Tugas berikutnya: ${nextTask ? nextTask.steps[nextTask.current].title : "lanjutkan pekerjaan shift"}. Seluruh tugas dikerjakan di satu halaman.` : "Pilih tanggal dan peserta untuk memulai siklus shift berikutnya."}</p></div><div className="flex flex-wrap gap-2">{!workers.length ? <Button asChild><Link href="/impor">Tambah data pekerja<ArrowRightIcon /></Link></Button> : <>{ongoing ? <Button asChild><Link href={`/shift/${ongoing.id}`} onClick={() => dispatch({ type: "BUKA_SHIFT", shiftId: ongoing.id })}>Lanjutkan shift<ArrowRightIcon /></Link></Button> : <ShiftForm />}</>}</div></section>
    {ongoing && <details className="mb-6"><summary className="cursor-pointer text-sm text-muted-foreground">Buat shift lain</summary><div className="mt-3"><ShiftForm /></div></details>}
    <section className="summon-panel" data-guide="shift-list"><div className="panel-heading"><h2>Daftar shift <span className="text-muted-foreground">({shifts.length})</span></h2><CalendarBlankIcon size={20} /></div><div className="divide-y">{shifts.map(shift => <article key={shift.id} className="shift-list-row"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{shift.nama}</h3><span className="shift-status" data-status={shift.status}>{shift.status === "CLOSED" && <CheckCircleIcon size={13} />}{shiftLabel(shift.status)}</span>{shift.contoh && <span className="text-xs text-muted-foreground">Contoh</span>}</div><p className="mt-2 text-sm text-muted-foreground">{tanggalLabel(shift.tanggal)} · {shift.workspace.pekerja.length} peserta</p></div><Button asChild variant="outline"><Link href={`/shift/${shift.id}`} onClick={() => dispatch({ type: "BUKA_SHIFT", shiftId: shift.id })}>{shift.status === "CLOSED" ? "Lihat hasil shift" : "Buka shift"}<ArrowRightIcon /></Link></Button></article>)}</div>{!shifts.length && <div className="p-8"><h3 className="font-medium">Belum ada shift</h3><p className="mt-2 text-sm text-muted-foreground">{user.role === "HSE" ? "Tambahkan pekerja, lalu buat draft shift pertama melalui tombol di atas." : "HSE membuat shift dan menetapkan peserta. Hubungi HSE yang bertanggung jawab untuk menyiapkan shift."}</p></div>}</section>
  </>
}

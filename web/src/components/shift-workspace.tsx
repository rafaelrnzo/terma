"use client"

import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShiftForm } from "@/components/shift-form"
import { ConfirmAction } from "@/components/confirm-action"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { useApp, useIzin } from "@/lib/store"
import { scopedWorkspace, tanggalLabel } from "@/lib/workspace"
import { workflow } from "@/lib/workflow"
import { pageAllowedFor } from "@/lib/navigation"
import { LABEL_PERAN } from "@/lib/access"
import { REGU, TUGAS, ZONA } from "@/lib/config"

export function ShiftWorkspace() {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  const shift = currentShift(workspace)
  if (!user || !shift) return null
  const state = scopedWorkspace(workspace, user)
  const progress = workflow(state, user)
  const plans = state.rencana.filter(plan => !plan.digantikan)
  const ids = new Set(plans.map(plan => plan.id))
  const actions = state.tindakan.filter(action => ids.has(action.rencanaId))
  const editable = shift.status === "DRAFT" && !state.rencana.some(plan => plan.disetujuiOleh) && !state.tindakan.length
  return <>
    <Link href="/ringkasan" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeftIcon />Daftar shift</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHeader title={shift.nama} summary={`${tanggalLabel(shift.tanggal)} · ${state.pekerja.length} pekerja · Lokasi 1`} /><span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span></div>
    <div className="mb-6 flex flex-wrap gap-2"><Button asChild><Link href="/monitoring">Monitoring shift<ArrowRightIcon /></Link></Button>{pageAllowedFor(user,"/laporan") && <Button asChild variant="outline"><Link href="/laporan">Laporan shift</Link></Button>}{editable && izin("KELOLA_SHIFT") && <><ShiftForm shift={shift} /><ConfirmAction label="Hapus draft" title="Hapus draft shift?" description="Draft dihapus. Master pekerja tetap tersimpan." onConfirm={() => dispatch({type:"HAPUS_SHIFT",shiftId:shift.id})} /></>}</div>
    {shift.status === "CLOSED" && <p className="mb-6 rounded-lg border bg-secondary p-4 text-sm" data-guide="closed-shift">Shift ditutup oleh {shift.ditutupOleh} pada {shift.ditutupPada && new Date(shift.ditutupPada).toLocaleString("id-ID")}. Rencana dan laporan dikunci.</p>}
    <div className="role-metrics" aria-label="Ringkasan shift"><div><span>Peserta</span><strong>{state.pekerja.length}</strong></div><div><span>Rencana disetujui</span><strong>{plans.filter(plan=>plan.disetujuiOleh).length}<small> / {plans.length}</small></strong></div><div><span>Laporan menunggu verifikasi</span><strong>{actions.filter(action=>action.status==="TINDAKAN_DILAPORKAN").length}</strong></div><div><span>Tindakan terverifikasi</span><strong>{actions.filter(action=>action.status==="TERVERIFIKASI").length}<small> / {actions.length}</small></strong></div></div>
    <section className="summon-panel mb-6" data-guide="shift-modules"><div className="panel-heading"><h2>Status operasional</h2></div><Table aria-label="Modul operasional shift"><TableHeader><TableRow><TableHead>Modul</TableHead><TableHead>Penanggung jawab</TableHead><TableHead>Cakupan</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader><TableBody>{progress.filter(item=>item.href!=="/impor" && pageAllowedFor(user,item.href)).map(item=><TableRow key={item.href}><TableCell className="font-medium">{item.label}</TableCell><TableCell>{item.peran.map(role=>LABEL_PERAN[role]).join(" · ")}</TableCell><TableCell>{item.progress}</TableCell><TableCell><span className="text-xs text-muted-foreground">{item.selesai ? "Lengkap" : item.href==="/laporan" ? "Tersedia" : "Perlu ditindaklanjuti"}</span></TableCell><TableCell><Button asChild variant="outline" size="sm"><Link href={item.href}>Buka modul<ArrowRightIcon /></Link></Button></TableCell></TableRow>)}</TableBody></Table></section>
    <section className="summon-panel" data-guide="shift-participants"><div className="panel-heading"><h2>Peserta & penugasan</h2><span className="text-xs text-muted-foreground">Snapshot shift · {shift.tanggal}</span></div><Table aria-label="Peserta dan penugasan shift"><TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Regu</TableHead><TableHead>Tugas</TableHead><TableHead>Zona</TableHead><TableHead>Adaptasi</TableHead></TableRow></TableHeader><TableBody>{state.pekerja.map(worker=>{const assignment=state.penugasan.find(row=>row.pekerjaKode===worker.kode);const confirmation=state.konfirmasi.find(row=>row.pekerjaKode===worker.kode);return <TableRow key={worker.kode}><TableCell>{pageAllowedFor(user,`/pekerja/${worker.kode}`) ? <Link href={`/pekerja/${worker.kode}`} className="font-medium text-primary">{worker.nama}</Link> : <strong className="font-medium">{worker.nama}</strong>}<p className="mt-1 text-xs text-muted-foreground">{worker.kode}</p></TableCell><TableCell>{REGU.find(row=>row.kode===worker.reguKode)?.nama}</TableCell><TableCell>{TUGAS.find(row=>row.kode===assignment?.tugasKode)?.nama}</TableCell><TableCell>{ZONA.find(row=>row.kode===assignment?.zonaKode)?.nama}</TableCell><TableCell>{confirmation ? confirmation.profil==="NORMAL" ? "Normal · dikonfirmasi" : `Hari ke-${confirmation.hariAdaptasi}` : "Belum dikonfirmasi"}</TableCell></TableRow>})}</TableBody></Table></section>
  </>
}

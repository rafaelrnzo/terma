"use client"

import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { DeviceReadingsButton } from "@/components/device-readings-button"
import { ShiftForm } from "@/components/shift-form"
import { ConfirmAction } from "@/components/confirm-action"
import { ShiftFocusCard } from "@/components/shift-navigator"
import { UbahPenugasan } from "@/components/rencana-card"
import { CsvImporter } from "@/components/csv-importer"
import { Button } from "@/components/ui/button"
import { REGU, TUGAS, ZONA } from "@/lib/config"
import { managedStages } from "@/lib/managed-journey"
import { currentShift, shiftLabel } from "@/lib/management-state"
import { useApp, useIzin } from "@/lib/store"
import { TEMPLATE } from "@/lib/templates"
import { scopedWorkspace, tanggalLabel } from "@/lib/workspace"
import { workflow } from "@/lib/workflow"
import { cn } from "@/lib/utils"

export function ShiftWorkspace() {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  const shift = currentShift(workspace)
  if (!user || !shift) return null
  const state = scopedWorkspace(workspace, user)
  const steps = workflow(state, user)
  const stages = managedStages(state, user)
  const closed = shift.status === "CLOSED"
  const issued = shift.workspace.rencana.some(plan => plan.disetujuiOleh) || shift.workspace.tindakan.length > 0
  const canEdit = shift.status === "DRAFT" && !issued
  return <>
    <Link href="/ringkasan" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeftIcon />Semua shift</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHeader title={shift.nama} summary={`${tanggalLabel(shift.tanggal)} · ${state.pekerja.length} peserta dalam lingkup Anda`} /><div className="flex flex-wrap items-center gap-2"><span className="shift-status" data-status={shift.status}>{shiftLabel(shift.status)}</span>{canEdit && <><ShiftForm key={shift.id} shift={shift} /><ConfirmAction label="Hapus draft" disabled={!izin("KELOLA_SHIFT")} title="Hapus draft shift?" description="Peserta, konfirmasi, dan bacaan pada draft ini akan dihapus. Master pekerja tetap tersedia untuk shift berikutnya." onConfirm={() => dispatch({ type: "HAPUS_SHIFT", shiftId: shift.id })} /></>}</div></div>
    {!closed && <ShiftFocusCard />}
    {closed ? <section className="summon-panel mt-6 p-6" data-guide="closed-shift"><div className="flex items-start gap-3"><CheckCircleIcon className="shrink-0 text-primary" size={28} /><div><h2 className="text-xl font-semibold">Siklus shift ini sudah selesai</h2><p className="mt-2 text-sm text-muted-foreground">Ditutup {shift.ditutupOleh} · {shift.ditutupPada && new Date(shift.ditutupPada).toLocaleString("id-ID")}. Identitas peserta, rencana, dan hasil pelaksanaan disimpan sebagai catatan akhir.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href="/laporan">Buka laporan akhir<ArrowRightIcon /></Link></Button><Button asChild variant="outline"><Link href="/ringkasan?buat=1">Buat shift berikutnya</Link></Button></div></div></div></section> : null}
    <details className="mt-6" open={closed ? undefined : true}>{closed && <summary className="cursor-pointer text-sm font-medium">Lihat riwayat langkah shift</summary>}
    <ol className="shift-workflow mt-6" aria-label="Pekerjaan dalam shift">{stages.map((stage, index) => <li className={cn("summon-panel workflow-task", stage.done && "workflow-task-done")} id={index === 0 ? "persiapan" : index === 4 ? "penutupan" : `langkah-${index + 1}`} key={stage.title}><div className="workflow-task-heading"><span className="stage-number">{stage.done ? <CheckCircleIcon size={19} /> : index + 1}</span><div><h2>{stage.title}</h2><p>{stage.done ? "Selesai" : stage.owner}</p></div></div>
      {index === 0 && <><p className="workflow-task-description">Periksa peserta dan penugasannya, lalu konfirmasi profil adaptasi. Peserta hadir sudah dicatat saat draft dibuat.</p><div className="divide-y">{state.pekerja.map(worker => {
        const assignment = state.penugasan.find(row => row.pekerjaKode === worker.kode)
        return <div key={worker.kode} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{worker.nama} <span className="text-xs font-normal text-muted-foreground">{worker.kode}</span></p><p className="mt-1 text-xs text-muted-foreground">{REGU.find(row => row.kode === worker.reguKode)?.nama} · {TUGAS.find(row => row.kode === assignment?.tugasKode)?.nama} · {ZONA.find(row => row.kode === assignment?.zonaKode)?.nama}</p></div>{assignment && izin("UBAH_PENUGASAN") && <UbahPenugasan pekerjaKode={worker.kode} zonaAwal={assignment.zonaKode} tugasAwal={assignment.tugasKode} />}</div>
      })}</div><Button asChild variant="outline"><Link href="/paparan">{closed ? "Lihat" : "Konfirmasi"} adaptasi peserta<ArrowRightIcon /></Link></Button><details className="mt-4"><summary className="cursor-pointer text-sm text-muted-foreground">Tambahkan riwayat kehadiran (opsional)</summary><div className="mt-4"><CsvImporter id="kehadiran" title="Riwayat kehadiran peserta" description="Impor absensi terdahulu sebagai bahan tinjauan adaptasi. Kehadiran bukan bukti paparan panas." template={TEMPLATE.kehadiran} result={state.imporLog.find(log => log.jenis === "kehadiran")} disabled={!izin("IMPOR")} onImport={(csv, source) => dispatch({ type: "IMPOR_KEHADIRAN", csv, source })} /></div></details></>}
      {index === 1 && <><p className="workflow-task-description">Lengkapi bacaan WBGT untuk zona peserta pada setiap interval shift. {state.bacaan.filter(row => row.tanggal === state.tanggal).length} bacaan tersimpan.</p><div className="flex flex-wrap gap-2"><DeviceReadingsButton /><Button asChild variant="outline"><Link href="/pengukuran">{closed ? "Lihat" : "Isi"} pengukuran panas<ArrowRightIcon /></Link></Button></div></>}
      {index === 2 && <><p className="workflow-task-description">Hitung rencana dari data peserta dan bacaan panas. Tinjau serta setujui setiap rencana, lalu terbitkan shift untuk memulai serah terima.</p><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/rencana">Tinjau rencana peserta<ArrowRightIcon /></Link></Button>{shift.status === "DRAFT" && <ConfirmAction label="Terbitkan shift" disabled={!izin("KELOLA_SHIFT") || !steps[3].selesai} title="Terbitkan shift?" description="Seluruh rencana telah disetujui. Shift akan berjalan dan instruksi siap dibagikan." onConfirm={() => dispatch({ type: "TERBITKAN_SHIFT", shiftId: shift.id })} />}</div>{shift.status === "DRAFT" && <p className="mt-3 text-xs text-muted-foreground">Syarat penerbitan: {steps[3].progress}. Peserta draft tidak bisa dihapus setelah persetujuan pertama.</p>}</>}
      {index === 3 && <><p className="workflow-task-description">HSE membagikan instruksi. Mandor mengakui penerimaan, menjalankan pekerjaan, lalu mengisi laporan aktual.</p><div className="flex flex-wrap gap-2">{shift.status === "DRAFT" ? <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LockSimpleIcon />Terbitkan shift untuk membuka pelaksanaan.</p> : <><Button asChild variant="outline"><Link href="/instruksi">Instruksi mandor<ArrowRightIcon /></Link></Button><Button asChild variant="outline"><Link href="/tindakan">Laporan pelaksanaan<ArrowRightIcon /></Link></Button></>}</div></>}
      {index === 4 && <><p className="workflow-task-description">HSE memverifikasi semua tindakan yang dilaporkan. Setelah lengkap, tutup shift melalui arahan utama untuk mengunci laporan akhir.</p><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/tindakan">Periksa verifikasi<ArrowRightIcon /></Link></Button><Button asChild variant="outline"><Link href="/laporan">{closed ? "Laporan akhir" : "Pratinjau laporan"}<ArrowRightIcon /></Link></Button>{!closed && <ConfirmAction label="Tutup shift" disabled={!izin("KELOLA_SHIFT") || shift.status !== "ACTIVE" || !steps[5].selesai} title="Tutup shift dan kunci laporan?" description="Seluruh tindakan telah terverifikasi. Identitas peserta, rencana, dan laporan menjadi hanya-baca." onConfirm={() => dispatch({ type: "TUTUP_SHIFT", shiftId: shift.id })} />}</div>{!closed && <p className="mt-3 text-xs text-muted-foreground">Syarat penutupan: shift sudah diterbitkan dan {steps[5].progress.toLocaleLowerCase("id-ID")}.</p>}</>}
    </li>)}</ol></details>
  </>
}

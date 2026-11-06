"use client"

import Link from "next/link"
import { ArrowRightIcon, CheckCircleIcon, ClipboardTextIcon, ThermometerIcon, CloudSunIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { useApp } from "@/lib/store"
import { managementOf } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { REGU, JAM_SHIFT } from "@/lib/config"
import type { ShiftRecord } from "@/lib/management-types"

export function RoleTaskBoard({ shift, workerCount }: { shift?: ShiftRecord; workerCount: number }) {
  const { state, user } = useApp()
  if (!user) return null
  const href = shift ? `/shift/${shift.id}` : "/ringkasan"
  const flow = shift ? shiftTaskFlow({ ...state, ...shift.workspace, tanggal: shift.tanggal, management: { ...managementOf(state), activeId: shift.id } }, user) : null
  if (user.role === "PETUGAS_DATA") {
    const zones = new Set(shift?.workspace.penugasan.map(assignment => assignment.zonaKode))
    const readings = shift?.workspace.bacaan.filter(reading => reading.tanggal === shift.tanggal && zones.has(reading.zonaKode)).length ?? 0
    const forecasts = shift?.workspace.prakiraan.filter(forecast => forecast.tanggal === shift.tanggal).length ?? 0
    const items = [
      { title: "Master pekerja", detail: `${workerCount} pekerja aktif. Lengkapi regu dan penugasan awal.`, icon: UsersThreeIcon, href: "/impor", cta: "Kelola pekerja" },
      { title: "Bacaan panas shift", detail: shift ? `${readings} dari ${zones.size * JAM_SHIFT.length} interval zona terisi. HSE meninjau kualitasnya.` : "Menunggu HSE membuat draft shift untuk pengisian bacaan.", icon: ThermometerIcon, href, cta: shift ? "Buka tugas Sensor" : "Lihat status shift" },
      { title: "Absensi & kondisi awal", detail: shift ? `${shift.readiness?.checkins.length ?? 0} dari ${shift.workspace.pekerja.length} peserta sudah mengisi check-in. HSE meninjau jawaban kondisi tubuh.` : "Buka draft shift untuk memulai absen pekerja.", icon: UsersThreeIcon, href: "/absensi", cta: "Periksa absensi" },
      { title: "Dokumen kesehatan perusahaan", detail: "Periksa kelengkapan ringkasan pemeriksaan. HSE mencatat kesimpulan serta pembatasan kerja.", icon: ClipboardTextIcon, href: "/kesehatan-awal", cta: "Cek kelengkapan" },
      { title: "Data prakiraan", detail: `${forecasts} periode tersedia pada tanggal shift. Lengkapi lokasi dan waktu produksi.`, icon: CloudSunIcon, href: "/forecasting", cta: "Lengkapi prakiraan" },
    ]
    return <section className="role-board summon-panel" aria-labelledby="data-board-title"><div className="panel-heading"><div><h2 id="data-board-title">Meja kerja petugas data</h2><p>Keluaran Anda: data lengkap untuk ditinjau HSE.</p></div></div><div className="data-checklist">{items.map(item => <Link key={item.title} href={item.href}><item.icon size={23} /><div><strong>{item.title}</strong><p>{item.detail}</p></div><span>{item.cta}<ArrowRightIcon size={15} /></span></Link>)}</div></section>
  }
  if (user.role === "MANDOR") {
    const tasks = [
      { title: "Terima instruksi", count: flow?.actions.filter(action => action.status === "DISAMPAIKAN").length ?? 0, detail: "Baca rencana HSE dan akui penerimaan." },
      { title: "Laporkan pekerjaan", count: flow?.actions.filter(action => action.status === "DIAKUI" || action.status === "BELUM_SELESAI").length ?? 0, detail: "Isi pelaksana, waktu, dan durasi aktual." },
      { title: "Tunggu verifikasi HSE", count: flow?.actions.filter(action => action.status === "TINDAKAN_DILAPORKAN").length ?? 0, detail: "Laporan terkirim untuk diperiksa HSE." },
    ]
    return <section className="role-board summon-panel" aria-labelledby="crew-board-title"><div className="panel-heading"><div><h2 id="crew-board-title">Papan tugas {REGU.find(crew => crew.kode === user.reguKode)?.nama}</h2><p>{shift ? shift.nama : "Instruksi muncul setelah HSE menyiapkan shift regu Anda."}</p></div><UsersThreeIcon size={23} /></div><ol className="crew-task-list">{tasks.map((task, index) => <li key={task.title}><span className="journey-number">{index + 1}</span><div><strong>{task.title}</strong><p>{task.detail}</p></div><span className="task-count">{task.count}<small>tindakan</small></span></li>)}</ol>{shift && <Link href={href} className="board-footer-link">Buka instruksi & laporan regu<ArrowRightIcon size={16} /></Link>}</section>
  }
  if (!shift) return <section className="role-board summon-panel p-6"><h2 className="text-lg font-semibold">Tidak ada shift yang menunggu tinjauan</h2><p className="mt-2 text-sm text-muted-foreground">Buat shift baru untuk mulai meninjau kondisi awal dan rencana. Shift selesai tetap dapat dibuka melalui daftar riwayat di bawah.</p></section>
  const checked = shift?.readiness?.checkins.length ?? 0
  const reviewed = shift?.readiness?.reviews.filter(review => review.hasil === "LANJUT_TINJAU_RENCANA").length ?? 0
  const pendingPlans = flow?.plans.filter(plan => !plan.disetujuiOleh).length ?? 0
  const reports = flow?.actions.filter(action => action.status === "TINDAKAN_DILAPORKAN").length ?? 0
  return <section className="role-board summon-panel" aria-labelledby="hse-board-title"><div className="panel-heading"><div><h2 id="hse-board-title">Meja tinjauan HSE</h2><p>{shift ? `${shift.nama} · keputusan yang menjadi tanggung jawab Anda` : "Buat atau buka shift untuk mulai meninjau rencana dan laporan."}</p></div></div><Link href="/absensi" className="board-footer-link"><span><strong>Absen & kondisi awal</strong><span className="mt-1 block text-xs text-muted-foreground">{checked}/{shift?.workspace.pekerja.length ?? 0} absen · {reviewed}/{shift?.workspace.pekerja.length ?? 0} ditinjau. Periksa baseline, keluhan, dan tindak lanjut.</span></span><ArrowRightIcon size={18} /></Link><div className="hse-review-grid"><Link href={href}><ClipboardTextIcon size={24} /><strong>{pendingPlans}<small>rencana belum disetujui</small></strong><p>Periksa profil adaptasi, batas kerja, dan sumber bacaan sebelum menerbitkan shift.</p><span className="panel-link">Tinjau rencana<ArrowRightIcon size={15} /></span></Link><Link href={href}><CheckCircleIcon size={24} /><strong>{reports}<small>laporan menunggu verifikasi</small></strong><p>Periksa durasi aktual dari mandor. Tutup shift setelah seluruh tindakan terverifikasi.</p><span className="panel-link">Verifikasi & tutup shift<ArrowRightIcon size={15} /></span></Link></div></section>
}

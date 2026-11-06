"use client"

import { useState } from "react"
import Link from "next/link"
import { HeartbeatIcon, MagnifyingGlassIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { WorkerHealthDetail } from "@/components/worker-health-detail"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { WorkerForm } from "@/components/worker-form"
import { ConfirmAction } from "@/components/confirm-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { REGU, TUGAS, ZONA, hariIni } from "@/lib/config"
import { managementOf } from "@/lib/management-state"
import { useApp, useIzin } from "@/lib/store"
import { workerUsage } from "@/lib/worker-management"
import { BASELINE_LABEL, BASELINE_VALIDITY_LABEL, CONDITION_LABEL, MONITORING_STATUS, workerHealthRows, type MonitoringStatus } from "@/lib/worker-health"
import { tanggalLabel } from "@/lib/workspace"

export function WorkerDirectory() {
  const { state, user, dispatch } = useApp()
  const izin = useIzin()
  const [query, setQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [date, setDate] = useState(hariIni)
  const [crew, setCrew] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  if (!user) return null
  const management = managementOf(state)
  const rows = workerHealthRows(management, user, date)
  const workers = rows.map(row => row.worker)
  const visible = rows.filter(row => !!row.worker.diarsipkan === showArchived)
  const filtered = visible.filter(({ worker, status: rowStatus }) => {
    const text = `${worker.nama} ${worker.kode} ${REGU.find(row => row.kode === worker.reguKode)?.nama ?? ""}`.toLocaleLowerCase("id-ID")
    return text.includes(query.toLocaleLowerCase("id-ID").trim()) && (!crew || worker.reguKode === crew) && (!status || rowStatus === status)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10)
  const isHse = user.role === "HSE"
  const hasFilters = !!(query || crew || status)
  return <section className="summon-panel mb-6" data-guide="worker-list" aria-labelledby="directory-title">
    <div className="panel-heading"><div><h2 id="directory-title">Data pekerja & pemantauan kesehatan</h2><p>{workers.filter(worker => !worker.diarsipkan).length} aktif · {workers.filter(worker => worker.diarsipkan).length} diarsipkan</p></div><WorkerForm /></div>
    <div className="grid grid-cols-2 gap-4 border-b p-5 lg:grid-cols-4" aria-label="Ringkasan pemantauan">
      <Metric label={showArchived ? "Pekerja diarsipkan" : "Pekerja aktif"} value={visible.length} />
      <Metric label="Perlu tinjauan HSE" value={visible.filter(row => row.status === "PERLU_TINJAU" || row.status === "DITUNDA").length} />
      <Metric label="Data belum lengkap" value={visible.filter(row => row.status === "DATA_KURANG").length} />
      <Metric label="Rencana disetujui" value={visible.filter(row => row.status === "DITINJAU").length} />
    </div>
    <div className="grid min-w-0 gap-4 border-b p-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-search">Cari nama, ID, atau regu</Label><div className="relative"><MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute top-3 left-3 text-muted-foreground" size={16} /><Input id="worker-search" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder="Cari pekerja…" className="pl-9" /></div></div>
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-monitoring-date">Tanggal pemantauan</Label><Input id="worker-monitoring-date" type="date" value={date} onChange={event => { if (event.target.value) { setDate(event.target.value); setPage(1) } }} /></div>
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-crew">Regu</Label><select id="worker-crew" className="management-select" value={crew} onChange={event => { setCrew(event.target.value); setPage(1) }}><option value="">Semua regu</option>{REGU.filter(row => user.role !== "MANDOR" || row.kode === user.reguKode).map(row => <option key={row.kode} value={row.kode}>{row.nama}</option>)}</select></div>
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-health-status">Status pemantauan</Label><select id="worker-health-status" className="management-select" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">Semua status</option>{Object.entries(MONITORING_STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"><p className="text-xs text-muted-foreground">{tanggalLabel(date)} · {showArchived ? "Arsip pekerja" : "Pekerja aktif"}{!isHse && " · Rincian kondisi hanya untuk Klinik"}</p><div className="flex gap-2">{hasFilters && <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCrew(""); setStatus(""); setPage(1) }}>Reset filter</Button>}<Button variant="outline" size="sm" onClick={() => { setShowArchived(value => !value); setPage(1) }}>{showArchived ? "Lihat pekerja aktif" : "Lihat arsip"}</Button></div></div>
    <Table className="worker-health-table" aria-label="Data pekerja dan pemantauan kesehatan">
      <TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Penugasan awal</TableHead><TableHead>Dokumen pemeriksaan</TableHead><TableHead>{isHse ? "Check-in" : "Check-in"}</TableHead><TableHead>Pemantauan HSE</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
      <TableBody>{paginated.map(row => {
        const { worker, assignment, health } = row
        const usage = workerUsage(state, worker.kode)
        return <TableRow key={worker.kode} aria-label={`Pekerja ${worker.nama}`}>
          <TableCell><div className="worker-identity"><span className="worker-avatar" aria-hidden>{worker.nama.split(" ").slice(0, 2).map(word => word[0]).join("")}</span><div><strong>{worker.nama}</strong><small>{worker.kode} · {REGU.find(item => item.kode === worker.reguKode)?.nama ?? worker.reguKode}</small></div></div></TableCell>
          <TableCell><p>{TUGAS.find(item => item.kode === assignment?.tugasKode)?.nama ?? "Belum ditugaskan"}</p><p className="mt-1 text-xs text-muted-foreground">{ZONA.find(item => item.kode === assignment?.zonaKode)?.nama ?? "Zona belum diisi"}</p></TableCell>
          <TableCell><p className={row.validity !== "BERLAKU" ? "text-status-tinjau" : "text-muted-foreground"}>{BASELINE_VALIDITY_LABEL[row.validity]}</p>{health?.baseline && <><p className="mt-1 text-xs">{BASELINE_LABEL[health.baseline.status]}</p><p className="mt-1 text-xs text-muted-foreground">s.d. {tanggalLabel(health.baseline.berlakuSampai)}</p></>}<p className="mt-1 text-xs text-muted-foreground">{row.shift ? "Salinan shift" : "Dokumen master"}</p></TableCell>
          <TableCell><p>{health?.checkin ? CONDITION_LABEL[health.checkin.kondisi] : row.checkedIn ? "Sudah check-in" : "Belum check-in"}</p>{health?.checkin?.keluhan.length ? <p className="mt-1 text-xs text-status-tinjau">{health.checkin.keluhan.join(", ")}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{row.shift?.nama ?? "Belum ada shift pada tanggal ini"}</p></TableCell>
          <TableCell><MonitoringBadge status={row.status} /><p className="mt-2 text-xs text-muted-foreground">{row.reviewed ? "Keputusan HSE tersimpan" : "Tinjauan belum tercatat"}</p></TableCell>
          <TableCell><div className="flex flex-wrap gap-2"><WorkerHealthDetail row={row} date={date} /><WorkerForm worker={worker} />
            {showArchived ? <Button variant="outline" disabled={!izin("KELOLA_PEKERJA")} onClick={() => dispatch({ type: "ARSIP_PEKERJA", kode: worker.kode, archived: false, expectedRevision: worker.revision ?? 1 })}>Aktifkan kembali</Button> : <ConfirmAction disabled={!izin("KELOLA_PEKERJA")} label={usage ? "Arsipkan" : "Hapus"} title={`${usage ? "Arsipkan" : "Hapus"} ${worker.nama}?`} description={usage ? "Pekerja tidak akan muncul saat membuat shift baru. Riwayat shift yang sudah ada tetap tersimpan." : "Data pekerja ini belum dipakai oleh shift. Identitas, penugasan awal, dan ringkasan baseline masternya akan dihapus."} onConfirm={() => dispatch(usage ? { type: "ARSIP_PEKERJA", kode: worker.kode, archived: true, expectedRevision: worker.revision ?? 1 } : { type: "HAPUS_PEKERJA", kode: worker.kode, expectedRevision: worker.revision ?? 1 })} />}
          </div></TableCell>
        </TableRow>
      })}</TableBody>
    </Table>
    {!filtered.length && <div className="p-8"><UsersThreeIcon size={28} aria-hidden className="mb-3 text-muted-foreground" /><h3 className="font-medium">{workers.length ? "Tidak ada pekerja yang cocok" : "Mulai dengan menambahkan pekerja"}</h3><p className="mt-2 text-sm text-muted-foreground">{workers.length ? "Periksa pencarian, filter regu, status, atau daftar arsip." : "Isi identitas, regu, dan penugasan awal lewat tombol Tambah pekerja."}</p></div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5"><p role="status" className="text-xs text-muted-foreground">{filtered.length ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)} dari ${filtered.length} pekerja` : "0 pekerja"}</p><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</Button><span className="text-xs tabular-nums">{currentPage} / {totalPages}</span><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Berikutnya</Button></div></div>
    <p className="flex items-start gap-2 border-t px-5 py-4 text-xs leading-relaxed text-muted-foreground"><HeartbeatIcon size={16} className="mt-0.5 shrink-0" aria-hidden />Ringkasan mengikuti tanggal pemantauan dan daftar aktif atau arsip, sebelum filter pencarian. Data kosong perlu dilengkapi. Status tinjauan bukan pernyataan sehat atau izin medis.</p>
    {workers.some(worker => !worker.diarsipkan) && <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5"><p className="text-sm text-muted-foreground">{user.role === "HSE" ? "Data siap. Berikutnya pilih peserta dan buat draft shift." : "Data siap. HSE memilih peserta dan membuat draft shift."}</p><Button asChild><Link href={user.role === "HSE" ? "/hse?buat=1" : "/admin"}>{user.role === "HSE" ? "Lanjut: buat shift" : "Lihat status persiapan"}</Link></Button></div>}
  </section>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div>
}

function MonitoringBadge({ status }: { status: MonitoringStatus }) {
  return <Badge variant={status === "DITUNDA" ? "batasi" : status === "PERLU_TINJAU" ? "tinjau" : "outline"}>{MONITORING_STATUS[status]}</Badge>
}

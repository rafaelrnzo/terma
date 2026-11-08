"use client"

import { OptionSelect } from "@/components/ui/option-select"
import { useState } from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass"
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree"
import { CompanyConnection } from "@/components/company-connection"
import { WorkerHealthDetail } from "@/components/worker-health-detail"
import { WorkerBandCell } from "@/components/band-assignment"
import { ReviewStateBadge } from "@/components/status"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { WorkerForm } from "@/components/worker-form"
import { WorkerRowActions } from "@/components/worker-row-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { REGU, TUGAS, ZONA, hariIni } from "@/lib/config"
import { currentShift, managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { BASELINE_LABEL, BASELINE_VALIDITY_LABEL, CONDITION_LABEL, MONITORING_STATUS, workerHealthRows, type MonitoringStatus } from "@/lib/worker-health"
import { tanggalValid } from "@/lib/store-utils"

export function WorkerDirectory({ initialDate }: { initialDate?: string }) {
  const { state, user } = useApp()
  const [query, setQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [date, setDate] = useState(() => initialDate && tanggalValid(initialDate) ? initialDate : currentShift(state)?.tanggal ?? hariIni())
  const [scope, setScope] = useState<"shift" | "all">(() => currentShift(state) ? "shift" : "all")
  const [crew, setCrew] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  if (!user) return null
  const management = managementOf(state)
  const rows = workerHealthRows(management, user, date)
  const workers = rows.map(row => row.worker)
  const selectedShift = management.shifts.find(shift => shift.tanggal === date)
  const participantCodes = new Set(selectedShift?.workspace.pekerja.map(worker => worker.kode) ?? [])
  const visible = rows.filter(row => scope === "shift" ? participantCodes.has(row.worker.kode) : !!row.worker.diarsipkan === showArchived)
  const filtered = visible.filter(({ worker, status: rowStatus }) => {
    const text = `${worker.nama} ${worker.kode} ${REGU.find(row => row.kode === worker.reguKode)?.nama ?? ""}`.toLocaleLowerCase("id-ID")
    return text.includes(query.toLocaleLowerCase("id-ID").trim()) && (!crew || worker.reguKode === crew) && (!status || rowStatus === status)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10)
  const isHse = user.role === "HSE"
  const showBand = isHse || user.role === "KLINIK"
  const hasFilters = !!(query || crew || status)
  return <section className="summon-panel mb-6" data-guide="worker-list" aria-labelledby="directory-title">
    <div className="panel-heading"><div><h2 id="directory-title">{scope === "shift" ? "Peserta shift" : "Direktori pekerja"}</h2><p>{scope === "shift" ? selectedShift?.nama ?? "Belum ada shift pada tanggal ini" : `${workers.filter(worker => !worker.diarsipkan).length} aktif · ${workers.filter(worker => worker.diarsipkan).length} diarsipkan`}</p></div><div className="flex flex-wrap gap-2"><OptionSelect aria-label="Lingkup pekerja" className="w-44" value={scope} onValueChange={value=>{setScope(value);setPage(1)}} options={[{value:"shift",label:"Peserta shift"},{value:"all",label:"Semua pekerja"}] as const} />{scope === "all" && <Button variant="ghost" size="sm" onClick={() => { setShowArchived(value => !value); setPage(1) }}>{showArchived ? "Pekerja aktif" : "Lihat arsip"}</Button>}<CompanyConnection /><WorkerForm /></div></div>
    <div className="grid grid-cols-2 gap-4 border-b p-5 lg:grid-cols-4" aria-label="Ringkasan pemantauan">
      <Metric label={scope === "shift" ? "Peserta shift" : showArchived ? "Pekerja diarsipkan" : "Pekerja aktif"} value={visible.length} />
      <Metric label="Perlu tinjauan HSE" value={visible.filter(row => row.status === "PERLU_TINJAU" || row.status === "DITUNDA").length} />
      <Metric label="Data belum lengkap" value={visible.filter(row => row.status === "DATA_KURANG").length} />
      <Metric label="Rencana disetujui" value={visible.filter(row => row.status === "DITINJAU").length} />
    </div>
    <div className="grid min-w-0 gap-4 border-b p-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-search">Cari nama, ID, atau regu</Label><div className="relative"><MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute top-3 left-3 text-muted-foreground" size={16} /><Input id="worker-search" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder="Cari pekerja…" className="pl-9" /></div></div>
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-monitoring-date">Tanggal pemantauan</Label><Input id="worker-monitoring-date" type="date" value={date} onChange={event => { if (event.target.value) { setDate(event.target.value); setPage(1) } }} /></div>
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-crew">Regu</Label><OptionSelect id="worker-crew" value={crew} onValueChange={value=>{setCrew(value);setPage(1)}} options={[{value:"",label:"Semua regu"},...REGU.filter(row=>user.role!=="MANDOR" || row.kode===user.reguKode).map(row=>({value:row.kode,label:row.nama}))]} /></div>
      <div className="min-w-0 space-y-2"><Label htmlFor="worker-health-status">Status pemantauan</Label><OptionSelect id="worker-health-status" value={status} onValueChange={value=>{setStatus(value);setPage(1)}} options={[{value:"",label:"Semua status"},...Object.entries(MONITORING_STATUS).map(([value,label])=>({value,label}))]} /></div>
    </div>
    {hasFilters && <div className="flex justify-end border-b px-5 py-2"><Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCrew(""); setStatus(""); setPage(1) }}>Reset filter</Button></div>}
    <Table className="worker-health-table" aria-label="Data pekerja dan pemantauan kesehatan">
      <TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Penugasan awal</TableHead><TableHead>Dokumen pemeriksaan</TableHead><TableHead>{isHse ? "Check-in" : "Check-in"}</TableHead><TableHead>Pemantauan HSE</TableHead>{showBand && <TableHead>TERMA Band</TableHead>}<TableHead>Aksi</TableHead></TableRow></TableHeader>
      <TableBody>{paginated.map(row => {
        const { worker, assignment, health } = row
        return <TableRow key={worker.kode} aria-label={`Pekerja ${worker.nama}`}>
          <TableCell><div className="worker-identity"><span className="worker-avatar" aria-hidden>{worker.nama.split(" ").slice(0, 2).map(word => word[0]).join("")}</span><div><strong>{worker.nama}</strong><small>{worker.kode} · {REGU.find(item => item.kode === worker.reguKode)?.nama ?? worker.reguKode}</small></div></div></TableCell>
          <TableCell><p>{TUGAS.find(item => item.kode === assignment?.tugasKode)?.nama ?? "Belum ditugaskan"}</p><p className="mt-1 text-xs text-muted-foreground">{ZONA.find(item => item.kode === assignment?.zonaKode)?.nama ?? "Zona belum diisi"}</p></TableCell>
          <TableCell><p>{health?.baseline ? BASELINE_LABEL[health.baseline.status] : BASELINE_VALIDITY_LABEL[row.validity]}</p>{health?.baseline && <p className="mt-1 text-xs text-muted-foreground">{row.validity === "BERLAKU" ? "Berlaku s.d." : BASELINE_VALIDITY_LABEL[row.validity]} {new Date(`${health.baseline.berlakuSampai}T00:00:00Z`).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"})}</p>}</TableCell>
          <TableCell><p>{health?.checkin ? CONDITION_LABEL[health.checkin.kondisi] : row.checkedIn ? "Sudah check-in" : "Belum check-in"}</p>{health?.checkin?.keluhan.length ? <p className="mt-1 text-xs text-status-tinjau">{health.checkin.keluhan.join(", ")}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{row.shift?.nama ?? "Tanpa shift"}</p></TableCell>
          <TableCell><MonitoringBadge status={row.status} adaptationReviewed={!!selectedShift?.workspace.konfirmasi.some(record=>record.pekerjaKode===worker.kode)} /></TableCell>
          {showBand && <TableCell><WorkerBandCell code={worker.kode} date={date} /></TableCell>}
          <TableCell><div className="worker-row-actions"><WorkerHealthDetail row={row} date={date} /><WorkerRowActions worker={worker} archived={!!worker.diarsipkan} /></div></TableCell>
        </TableRow>
      })}</TableBody>
    </Table>
    {!filtered.length && <div className="p-8"><UsersThreeIcon size={28} aria-hidden className="mb-3 text-muted-foreground" /><h3 className="font-medium">{scope === "shift" && !selectedShift ? "Belum ada shift pada tanggal ini" : workers.length ? "Tidak ada pekerja yang cocok" : "Mulai dengan menambahkan pekerja"}</h3><p className="mt-2 text-sm text-muted-foreground">{scope === "shift" && !selectedShift ? "Pilih tanggal shift atau buka daftar semua pekerja." : workers.length ? "Periksa pencarian, regu, status, atau arsip." : "Tambahkan identitas dan penugasan pekerja."}</p></div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5"><p role="status" className="text-xs text-muted-foreground">{filtered.length ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)} dari ${filtered.length} pekerja` : "0 pekerja"}</p><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</Button><span className="text-xs tabular-nums">{currentPage} / {totalPages}</span><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Berikutnya</Button></div></div>

  </section>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div>
}

function MonitoringBadge({ status, adaptationReviewed }: { status: MonitoringStatus; adaptationReviewed?: boolean }) {
  if (status === "DITINJAU") return <ReviewStateBadge state="approved" label="Rencana disetujui" />
  if (adaptationReviewed && status === "PERLU_TINJAU") return <ReviewStateBadge state="reviewed" label="Adaptasi ditinjau" />
  if (status === "PERLU_TINJAU") return <ReviewStateBadge state="pending" />
  return <Badge variant={status === "DITUNDA" ? "batasi" : "outline"}>{MONITORING_STATUS[status]}</Badge>
}

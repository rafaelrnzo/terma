"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus"
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass"
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree"
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/csr/CalendarBlank"
import { Button } from "@/components/ui/button"
import { OptionSelect } from "@/components/ui/option-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { hariIni, REGU } from "@/lib/config"
import { managementOf } from "@/lib/management-state"
import type { ShiftRecord } from "@/lib/management-types"
import { useApp, useIzin } from "@/lib/store"

export function ShiftForm({ shift }: { shift?: ShiftRecord }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const router = useRouter()
  const management = managementOf(state)
  const [open, setOpen] = useState(false)
  const [tanggal, setTanggal] = useState(shift?.tanggal ?? hariIni())
  const [nama, setNama] = useState(shift?.nama ?? "Shift pagi")
  const [selected, setSelected] = useState<string[]>(shift?.workspace.pekerja.map(worker => worker.kode) ?? [])
  const [query, setQuery] = useState("")
  const [crew, setCrew] = useState("")
  const [error, setError] = useState("")
  const workers = management.workers.filter(worker => !worker.diarsipkan && worker.tanggalMulai <= tanggal)
  const filtered = workers.filter(worker => (!crew || worker.reguKode === crew) && `${worker.nama} ${worker.kode}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")))
  const eligible = new Set(workers.map(worker => worker.kode))
  const participantCodes = selected.filter(code => eligible.has(code))
  const issued = shift?.workspace.rencana.some(plan => plan.disetujuiOleh)
  const editable = !shift || (shift.status === "DRAFT" && !issued && !shift.workspace.tindakan.length)
  useEffect(() => {
    if (!shift && new URLSearchParams(window.location.search).get("buat") === "1") setOpen(true)
  }, [shift])
  function submit(event: FormEvent) {
    event.preventDefault()
    if (nama.trim().length < 3 || !participantCodes.length) { setError("Isi nama shift dan pilih minimal satu peserta."); return }
    if (!shift && management.shifts.some(item => item.tanggal === tanggal)) { setError("Sudah ada shift pada tanggal ini. Buka shift tersebut dari daftar."); return }
    dispatch(shift ? { type: "UBAH_SHIFT", shiftId: shift.id, nama, workerCodes: participantCodes } : { type: "BUAT_SHIFT", tanggal, nama, workerCodes: participantCodes })
    setOpen(false)
    router.push(`/shift/${shift?.id ?? tanggal}`)
  }
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setError("") }}><DialogTrigger asChild><Button variant={shift ? "outline" : "default"} disabled={!izin("KELOLA_SHIFT") || !editable || !management.workers.some(worker => !worker.diarsipkan)} data-guide={shift ? "edit-shift" : "create-shift"}>{shift ? <PencilSimpleIcon /> : <PlusIcon />}{shift ? "Edit draft" : "Buat shift"}</Button></DialogTrigger>
    <DialogContent className="shift-composer" aria-describedby="shift-form-description">
      <DialogHeader className="shift-composer-header"><span className="section-kicker"><CalendarBlankIcon size={18} />PENJADWALAN</span><DialogTitle>{shift ? "Edit draft shift" : "Buat shift"}</DialogTitle><DialogDescription id="shift-form-description">{shift ? "Perbarui penjadwalan dan peserta." : "Tentukan jadwal dan peserta untuk rencana kerja."}</DialogDescription></DialogHeader>
      <form onSubmit={submit}>
        <div className="shift-composer-grid">
          <aside className="shift-composer-settings"><h3>Jadwal shift</h3><div className="space-y-2"><Label htmlFor="shift-name">Nama shift</Label><Input id="shift-name" value={nama} onChange={e => setNama(e.target.value)} required minLength={3} /></div><div className="space-y-2"><Label htmlFor="shift-date">Tanggal</Label><Input id="shift-date" type="date" value={tanggal} disabled={!!shift} onChange={e => setTanggal(e.target.value)} required /></div><div className="shift-selection-summary"><UsersThreeIcon size={24} /><strong>{participantCodes.length}<small>pekerja dipilih</small></strong><span>{new Set(workers.filter(worker => participantCodes.includes(worker.kode)).map(worker => worker.reguKode)).size} regu · 08.00–16.00</span></div></aside>
          <fieldset className="shift-participant-picker"><legend className="sr-only">Peserta shift</legend><div className="picker-heading"><h3>Peserta shift <span>{workers.length}</span></h3><Button type="button" size="sm" variant="ghost" disabled={!filtered.length} onClick={() => setSelected(previous => filtered.every(worker => participantCodes.includes(worker.kode)) ? previous.filter(code => !filtered.some(worker => worker.kode === code)) : [...new Set([...previous, ...filtered.map(worker => worker.kode)])])}>{filtered.length > 0 && filtered.every(worker => participantCodes.includes(worker.kode)) ? "Batalkan pilihan" : "Pilih semua hasil"}</Button></div>
            <div className="picker-filters"><div className="relative"><Label htmlFor="shift-worker-search" className="sr-only">Cari peserta</Label><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" size={16} /><Input id="shift-worker-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari nama atau ID…" className="pl-9" /></div><OptionSelect aria-label="Filter regu peserta" value={crew} onValueChange={setCrew} options={[{value:"",label:"Semua regu"},...REGU.map(item=>({value:item.kode,label:item.nama}))]} /></div>
            <div className="shift-participant-list">{filtered.map(worker => <label key={worker.kode} className="shift-participant" data-selected={participantCodes.includes(worker.kode)}><input type="checkbox" checked={participantCodes.includes(worker.kode)} onChange={event => setSelected(previous => event.target.checked ? [...new Set([...previous, worker.kode])] : previous.filter(code => code !== worker.kode))} /><span className="worker-avatar" aria-hidden>{worker.nama.split(" ").slice(0,2).map(word=>word[0]).join("")}</span><span><strong>{worker.nama}</strong><small>{worker.kode}</small></span><span className="participant-crew">{REGU.find(row => row.kode === worker.reguKode)?.nama}</span></label>)}{!filtered.length && <p className="page-empty">{workers.length ? "Tidak ada pekerja yang cocok." : "Belum ada pekerja aktif pada tanggal ini."}</p>}</div>
          </fieldset>
        </div>
        <div className="shift-composer-footer"><div aria-live="polite">{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : shift ? <p className="text-xs text-muted-foreground">Adaptasi dan perhitungan draft akan diatur ulang.</p> : <span className="text-sm text-muted-foreground">{participantCodes.length} peserta · {tanggal}</span>}</div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" disabled={!participantCodes.length}>{shift ? "Simpan draft" : "Buat draft shift"}</Button></div></div>
      </form>
    </DialogContent>
  </Dialog>
}

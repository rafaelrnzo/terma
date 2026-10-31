"use client"

import { useState, type FormEvent } from "react"
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { REGU, TUGAS, ZONA, hariIni } from "@/lib/config"
import { managementOf } from "@/lib/management-state"
import type { WorkerInput } from "@/lib/management-types"
import { useApp, useIzin } from "@/lib/store"
import type { Pekerja } from "@/lib/types"
import { workerInputError } from "@/lib/worker-management"

export function WorkerForm({ worker }: { worker?: Pekerja }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const management = managementOf(state)
  const assignment = management.assignments.find(item => item.pekerjaKode === worker?.kode)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const initial = (): WorkerInput => ({ kode: worker?.kode ?? "", nama: worker?.nama ?? "", reguKode: worker?.reguKode ?? "COR", tanggalMulai: worker?.tanggalMulai ?? hariIni(), tugasKode: assignment?.tugasKode ?? "PEMERIKSAAN", zonaKode: assignment?.zonaKode ?? "GUDANG", apd: assignment?.apd ?? "Standar" })
  const [input, setInput] = useState(initial)
  function field(key: keyof WorkerInput, value: string) { setInput(previous => ({ ...previous, [key]: value })) }
  function submit(event: FormEvent) {
    event.preventDefault()
    const invalid = workerInputError(input) || (!worker && management.workers.some(item => item.kode === input.kode) ? "ID pekerja sudah digunakan." : "")
    if (invalid) { setError(invalid); return }
    dispatch({ type: "SIMPAN_PEKERJA", input, previousCode: worker?.kode, expectedRevision: worker?.revision ?? 1 })
    setOpen(false)
  }
  return <Dialog open={open} onOpenChange={value => { setOpen(value); if (value) { setInput(initial()); setError("") } }}>
    <DialogTrigger asChild><Button variant={worker ? "outline" : "default"} disabled={!izin("KELOLA_PEKERJA")} data-guide={worker ? undefined : "add-worker"}>{worker ? <PencilSimpleIcon /> : <PlusIcon />}{worker ? "Edit" : "Tambah pekerja"}<span className="sr-only">{worker ? ` ${worker.nama}` : ""}</span></Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{worker ? "Edit pekerja" : "Tambah pekerja"}</DialogTitle><DialogDescription>Isi identitas dan penugasan awal. Data ini dipilih saat membuat shift.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="worker-code">ID pekerja</Label><Input id="worker-code" value={input.kode} disabled={!!worker} onChange={e => field("kode", e.target.value.trim())} required maxLength={32} placeholder="PK001" /><p className="text-xs text-muted-foreground">ID tetap digunakan untuk riwayat shift.</p></div>
          <div className="space-y-2"><Label htmlFor="worker-name">Nama pekerja</Label><Input id="worker-name" value={input.nama} onChange={e => field("nama", e.target.value)} required minLength={2} /></div>
          <div className="space-y-2"><Label htmlFor="worker-regu">Regu</Label><select id="worker-regu" className="management-select" value={input.reguKode} onChange={e => field("reguKode", e.target.value)}>{REGU.map(row => <option key={row.kode} value={row.kode}>{row.nama}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="worker-start">Tanggal mulai bekerja</Label><Input id="worker-start" type="date" value={input.tanggalMulai} onChange={e => field("tanggalMulai", e.target.value)} required /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="worker-task">Tugas awal</Label><select id="worker-task" className="management-select" value={input.tugasKode} onChange={e => field("tugasKode", e.target.value)}>{TUGAS.map(row => <option key={row.kode} value={row.kode}>{row.nama}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="worker-zone">Zona awal</Label><select id="worker-zone" className="management-select" value={input.zonaKode} onChange={e => field("zonaKode", e.target.value)}>{ZONA.map(row => <option key={row.kode} value={row.kode}>{row.nama}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="worker-apd">APD</Label><Input id="worker-apd" value={input.apd} onChange={e => field("apd", e.target.value)} required /></div>
        </div>
        {worker && <p className="text-sm text-muted-foreground">Perubahan berlaku untuk shift berikutnya. Penugasan di shift yang sudah ada dikelola dari halaman shift tersebut.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button type="submit">{worker ? "Simpan perubahan" : "Simpan pekerja"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}

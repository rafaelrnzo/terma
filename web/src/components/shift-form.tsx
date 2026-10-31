"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
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
  const [error, setError] = useState("")
  const workers = management.workers.filter(worker => !worker.diarsipkan && worker.tanggalMulai <= tanggal)
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
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{shift ? "Edit draft shift" : "Buat draft shift"}</DialogTitle><DialogDescription>Pilih tanggal dan pekerja yang hadir. Satu lokasi memiliki satu shift per tanggal pada lokasi ini.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="shift-name">Nama shift</Label><Input id="shift-name" value={nama} onChange={e => setNama(e.target.value)} required minLength={3} /></div><div className="space-y-2"><Label htmlFor="shift-date">Tanggal shift</Label><Input id="shift-date" type="date" value={tanggal} disabled={!!shift} onChange={e => setTanggal(e.target.value)} required /></div></div>
        <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Peserta hadir · {participantCodes.length} dipilih</legend><p className="text-xs text-muted-foreground">Peserta menggunakan salinan identitas dan penugasan saat draft disimpan. Profil adaptasi tetap dikonfirmasi HSE.</p><div className="max-h-64 overflow-y-auto rounded-md border">{workers.map(worker => <label key={worker.kode} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-0"><input type="checkbox" className="size-4 accent-primary" checked={participantCodes.includes(worker.kode)} onChange={event => setSelected(previous => event.target.checked ? [...previous, worker.kode] : previous.filter(code => code !== worker.kode))} /><span className="text-sm"><strong className="font-medium">{worker.nama}</strong><span className="mt-1 block text-xs text-muted-foreground">{worker.kode} · {REGU.find(row => row.kode === worker.reguKode)?.nama}</span></span></label>)}{!workers.length && <p className="p-4 text-sm text-muted-foreground">Belum ada pekerja aktif yang mulai bekerja pada tanggal ini. Tambahkan di Data pekerja atau ubah tanggal shift.</p>}</div></fieldset>
        {shift && <p className="text-sm text-muted-foreground">Mengubah draft akan mengosongkan konfirmasi adaptasi dan hasil perhitungan. Bacaan panas tetap tersimpan.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button type="submit">{shift ? "Simpan draft" : "Buat draft & mulai"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { WorkerForm } from "@/components/worker-form"
import { ConfirmAction } from "@/components/confirm-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { lingkupPekerja } from "@/lib/access"
import { REGU, TUGAS, ZONA } from "@/lib/config"
import { managementOf } from "@/lib/management-state"
import { useApp, useIzin } from "@/lib/store"
import { workerUsage } from "@/lib/worker-management"

export function WorkerDirectory() {
  const { state, user, dispatch } = useApp()
  const izin = useIzin()
  const [query, setQuery] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  if (!user) return null
  const management = managementOf(state)
  const workers = lingkupPekerja(user, management.workers)
  const filtered = workers.filter(worker => (!!worker.diarsipkan === showArchived) && `${worker.nama} ${worker.kode}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID").trim()))
  return <section className="summon-panel mb-6" data-guide="worker-list">
    <div className="panel-heading flex-wrap gap-3"><div><h2>Data pekerja</h2><p className="mt-1 text-xs text-muted-foreground">{workers.filter(worker => !worker.diarsipkan).length} aktif · {workers.filter(worker => worker.diarsipkan).length} diarsipkan</p></div><WorkerForm /></div>
    <div className="flex flex-wrap items-end gap-4 border-b p-5"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="worker-search">Cari nama atau ID</Label><Input id="worker-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari pekerja…" /></div><Button variant="outline" onClick={() => setShowArchived(value => !value)}>{showArchived ? "Lihat pekerja aktif" : "Lihat arsip"}</Button></div>
    <div className="divide-y">{filtered.map(worker => {
      const assignment = management.assignments.find(item => item.pekerjaKode === worker.kode)
      const usage = workerUsage(state, worker.kode)
      return <article key={worker.kode} className="worker-master-row" aria-label={`Pekerja ${worker.nama}`}><div><h3 className="font-medium">{worker.nama}</h3><p className="mt-1 text-xs text-muted-foreground">{worker.kode} · {REGU.find(row => row.kode === worker.reguKode)?.nama}</p></div><div className="text-sm"><p>{TUGAS.find(row => row.kode === assignment?.tugasKode)?.nama}</p><p className="mt-1 text-xs text-muted-foreground">{ZONA.find(row => row.kode === assignment?.zonaKode)?.nama} · {usage} shift</p></div><div className="flex flex-wrap gap-2"><WorkerForm worker={worker} />
        {showArchived ? <Button variant="outline" disabled={!izin("KELOLA_PEKERJA")} onClick={() => dispatch({ type: "ARSIP_PEKERJA", kode: worker.kode, archived: false, expectedRevision: worker.revision ?? 1 })}>Aktifkan kembali</Button> : <ConfirmAction disabled={!izin("KELOLA_PEKERJA")} label={usage ? "Arsipkan" : "Hapus"} title={`${usage ? "Arsipkan" : "Hapus"} ${worker.nama}?`} description={usage ? "Pekerja tidak akan muncul saat membuat shift baru. Riwayat shift yang sudah ada tetap tersimpan." : "Data pekerja ini belum dipakai oleh shift. Identitas dan penugasan awalnya akan dihapus."} onConfirm={() => dispatch(usage ? { type: "ARSIP_PEKERJA", kode: worker.kode, archived: true, expectedRevision: worker.revision ?? 1 } : { type: "HAPUS_PEKERJA", kode: worker.kode, expectedRevision: worker.revision ?? 1 })} />}
      </div></article>
    })}</div>
    {!filtered.length && <div className="p-8"><h3 className="font-medium">{workers.length ? "Tidak ada pekerja yang cocok" : "Mulai dengan menambahkan pekerja"}</h3><p className="mt-2 text-sm text-muted-foreground">{workers.length ? "Periksa pencarian atau daftar arsip." : "Isi identitas, regu, dan penugasan awal lewat tombol Tambah pekerja."}</p></div>}
    {workers.some(worker => !worker.diarsipkan) && <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5"><p className="text-sm text-muted-foreground">Data siap. Berikutnya pilih peserta dan buat draft shift.</p><Button asChild><Link href="/ringkasan?buat=1">Lanjut: buat shift</Link></Button></div>}
  </section>
}

"use client"

import { useState } from "react"
import { WorkerAdaptation } from "@/components/worker-adaptation"
import { ReviewStateBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/ui/option-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { kandidatUntuk, useApp } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"
import { REGU } from "@/lib/config"

export function AdaptationWorklist() {
  const { state: workspace, user } = useApp()
  const [query,setQuery] = useState("")
  const [filter,setFilter] = useState("ALL")
  const [selected,setSelected] = useState("")
  if (!user) return null
  const state = scopedWorkspace(workspace,user)
  const rows = state.pekerja.map(worker=>({worker,confirmation:state.konfirmasi.find(row=>row.pekerjaKode===worker.kode),candidate:kandidatUntuk(state,worker)}))
  const confirmed = rows.filter(row=>row.confirmation).length
  const filtered = rows.filter(row=>`${row.worker.nama} ${row.worker.kode}`.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id")) && (filter==="ALL" || (filter==="PENDING" ? !row.confirmation : !!row.confirmation))).toSorted((a,b)=>Number(!!a.confirmation)-Number(!!b.confirmation))
  const opened = rows.find(row=>row.worker.kode===selected)
  return <>
    <section className="summon-panel" data-guide="adaptation"><div className="panel-heading"><div><h2>Daftar adaptasi</h2><p>{confirmed}/{rows.length} pekerja dikonfirmasi</p></div></div>
      <div className="grid gap-4 border-b p-5 sm:grid-cols-[minmax(0,1fr)_15rem]"><div className="space-y-2"><Label htmlFor="adaptation-search">Cari pekerja</Label><Input id="adaptation-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nama atau ID pekerja" /></div><div className="space-y-2"><Label htmlFor="adaptation-status">Status konfirmasi</Label><OptionSelect id="adaptation-status" value={filter} onValueChange={setFilter} options={[{value:"ALL",label:"Semua pekerja"},{value:"PENDING",label:"Belum dikonfirmasi"},{value:"DONE",label:"Sudah dikonfirmasi"}]} /></div></div>
      <Table aria-label="Daftar adaptasi pekerja"><TableHeader><TableRow><TableHead>Pekerja</TableHead><TableHead>Regu</TableHead><TableHead>Pemicu tinjauan</TableHead><TableHead>Status tinjauan</TableHead><TableHead>Hari adaptasi</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map(({worker,confirmation,candidate})=><TableRow key={worker.kode}><TableCell><strong className="font-medium">{worker.nama}</strong><p className="mt-1 text-xs text-muted-foreground">{worker.kode}</p></TableCell><TableCell>{REGU.find(row=>row.kode===worker.reguKode)?.nama}</TableCell><TableCell>{candidate.pemicu ? candidate.pemicu==="PEKERJA_BARU" ? "Pekerja baru" : candidate.pemicu==="RIWAYAT_TIDAK_LENGKAP" ? "Riwayat tidak lengkap" : "Kembali setelah absen" : "Tanpa pemicu"}</TableCell><TableCell><ReviewStateBadge state={confirmation ? "reviewed" : "pending"} />{confirmation && <p className="mt-1 text-xs text-muted-foreground">{confirmation.profil==="NORMAL" ? "Normal" : confirmation.profil==="PEKERJA_BARU" ? "Pekerja baru" : "Berpengalaman kembali"}</p>}</TableCell><TableCell>{confirmation?.profil==="NORMAL" ? "—" : confirmation?.hariAdaptasi ?? "—"}</TableCell><TableCell><Button variant="outline" aria-label={`Tinjau adaptasi ${worker.nama}`} onClick={()=>setSelected(worker.kode)}>{confirmation ? "Lihat tinjauan" : "Tinjau adaptasi"}</Button></TableCell></TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Tidak ada pekerja yang cocok dengan pencarian dan filter.</TableCell></TableRow>}</TableBody></Table>
    </section>
    <Dialog open={!!opened} onOpenChange={open=>{if(!open)setSelected("")}}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Adaptasi · {opened?.worker.nama}</DialogTitle><DialogDescription>{opened?.worker.kode} · {REGU.find(row=>row.kode===opened?.worker.reguKode)?.nama}</DialogDescription></DialogHeader>{opened && <WorkerAdaptation key={opened.worker.kode} p={opened.worker} compact onSaved={()=>setSelected("")} />}</DialogContent></Dialog>
  </>
}

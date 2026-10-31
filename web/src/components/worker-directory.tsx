"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpRightIcon as ArrowUpRight } from "@phosphor-icons/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusChip } from "@/components/status"
import { lingkupPekerja } from "@/lib/access"
import { REGU, TUGAS, ZONA } from "@/lib/config"
import { rencanaAktif, useApp } from "@/lib/store"

export function WorkerDirectory() {
  const { state, user } = useApp()
  const [query, setQuery] = useState("")
  const [crew, setCrew] = useState("SEMUA")
  if (!user) return null
  const workers = lingkupPekerja(user, state.pekerja)
  const terms = query.toLocaleLowerCase("id-ID").trim().split(/\s+/)
  const filtered = workers.filter(p => (crew === "SEMUA" || p.reguKode === crew) && terms.every(t => `${p.nama} ${p.kode}`.toLocaleLowerCase("id-ID").includes(t)))
  const plans = rencanaAktif(state)
  return <Card className="mb-6">
    <CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Direktori pekerja</CardTitle><CardDescription className="mt-2">{workers.length} pekerja dalam lingkup Anda. Buka profil untuk melihat penugasan, adaptasi, dan tindak lanjut.</CardDescription></div><Button asChild variant="outline"><a href="#impor-data">Kelola data CSV<ArrowUpRight aria-hidden /></a></Button></div></CardHeader>
    <CardContent>
      <div className="mb-5 grid items-end gap-3 sm:grid-cols-[1fr_220px]">
        <div className="space-y-2"><Label htmlFor="worker-search">Cari pekerja</Label><Input id="worker-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nama atau ID pekerja" /></div>
        <div className="space-y-2"><Label htmlFor="worker-crew">Regu</Label><Select value={crew} onValueChange={setCrew}><SelectTrigger id="worker-crew" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SEMUA">Semua regu dalam lingkup</SelectItem>{REGU.filter(g => user.role !== "MANDOR" || g.kode === user.reguKode).map(g => <SelectItem value={g.kode} key={g.kode}>{g.nama}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <p className="mb-2 text-xs text-muted-foreground" role="status">Menampilkan {filtered.length} dari {workers.length} pekerja · tanggal rencana {state.tanggal}</p>
      <div className="divide-y">{filtered.map(p => {
        const assignment = state.penugasan.find(a => a.pekerjaKode === p.kode)
        const plan = plans.find(r => r.pekerjaKode === p.kode)
        return <Link href={`/pekerja/${p.kode}`} key={p.kode} className="group grid items-center gap-3 rounded-md px-2 py-4 hover:bg-muted sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-medium" aria-hidden>{p.nama.slice(0, 2).toUpperCase()}</span><span><span className="block font-medium group-hover:text-primary">{p.nama}</span><span className="mt-1 block text-xs text-muted-foreground">{p.kode} · {REGU.find(g => g.kode === p.reguKode)?.nama}</span></span></div>
          <div className="text-sm"><p>{TUGAS.find(t => t.kode === assignment?.tugasKode)?.nama ?? "Belum ditugaskan"}</p><p className="mt-1 text-xs text-muted-foreground">{ZONA.find(z => z.kode === assignment?.zonaKode)?.nama ?? "Zona belum dipilih"}</p></div>
          <div className="flex items-center justify-between gap-3">{plan ? <StatusChip status={plan.status} /> : <span className="text-xs text-muted-foreground">Belum ada rencana</span>}<ArrowUpRight className="size-4 shrink-0" aria-hidden /></div>
        </Link>
      })}</div>
      {!filtered.length && <div className="py-8"><h3 className="font-medium">Tidak ada pekerja yang cocok</h3><p className="mt-2 text-sm text-muted-foreground">Coba nama lain atau tampilkan semua regu. Jika belum ada data, tambahkan data contoh di bagian impor.</p><Button className="mt-4" variant="outline" onClick={() => { setCrew("SEMUA"); setQuery("") }}>Reset pencarian & filter</Button></div>}
    </CardContent>
  </Card>
}

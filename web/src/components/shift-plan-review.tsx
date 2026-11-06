"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/ui/option-select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { QualityBadge, RiskBadge, StatusChip } from "@/components/status"
import { ConfirmAction } from "@/components/confirm-action"
import { rencanaAktif, useApp, useIzin } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { scopedWorkspace } from "@/lib/workspace"
import { REGU, ZONA } from "@/lib/config"

export function ShiftPlanReview() {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  const [selected,setSelected] = useState<string[]>([])
  const [query,setQuery] = useState("")
  const [crew,setCrew] = useState("")
  const [status,setStatus] = useState("ALL")
  if (!user) return null
  const state = scopedWorkspace(workspace,user), shift = currentShift(workspace)
  const rank = { MERAH:0, DATA_KURANG:1, KUNING:2, HIJAU:3 }
  const all = rencanaAktif(state)
  const plans = all.filter(plan=>{const worker=state.pekerja.find(row=>row.kode===plan.pekerjaKode);return `${worker?.nama} ${plan.pekerjaKode}`.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id")) && (!crew || worker?.reguKode===crew) && (status==="ALL" || (status==="PENDING" ? !plan.disetujuiOleh : !!plan.disetujuiOleh))}).toSorted((a,b)=>(rank[a.riskColour ?? "DATA_KURANG"]-rank[b.riskColour ?? "DATA_KURANG"]) || Number(!!a.disetujuiOleh)-Number(!!b.disetujuiOleh))
  const approved = all.filter(plan=>plan.disetujuiOleh).length
  const eligible = plans.filter(plan=>!plan.disetujuiOleh && plan.riskColour === "HIJAU" && plan.intervals.every(row=>row.kualitas === "TERUKUR" || row.kualitas === "REPLAY"))
  const selectedPlans = eligible.filter(plan=>selected.includes(plan.id))
  if (!state.rencanaDihitung) return <div className="space-y-4"><h2 className="font-semibold">Draf rencana belum dihitung</h2><p className="text-sm text-muted-foreground">Lengkapi penugasan, adaptasi dan sumber panas melalui modul terkait.</p><Button disabled={!izin("HITUNG_RENCANA")} onClick={()=>dispatch({type:"HITUNG_RENCANA"})}>Hitung rencana shift</Button></div>
  return <div data-guide="plans" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground" role="status">{approved}/{state.pekerja.length} rencana disetujui · prioritas merah dan data kurang</p><Button variant="outline" disabled={!izin("SETUJUI_RENCANA") || !selectedPlans.length} onClick={()=>{for(const plan of selectedPlans)dispatch({type:"SETUJUI",rencanaId:plan.id});setSelected([])}}>Setujui hijau terpilih ({selectedPlans.length})</Button></div>
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]"><div className="space-y-2"><Label htmlFor="plan-search">Cari pekerja</Label><Input id="plan-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nama atau ID pekerja" /></div><div className="space-y-2"><Label htmlFor="plan-crew">Regu</Label><OptionSelect id="plan-crew" value={crew} onValueChange={setCrew} options={[{value:"",label:"Semua regu"},...REGU.map(row=>({value:row.kode,label:row.nama}))]} /></div><div className="space-y-2"><Label htmlFor="plan-status">Persetujuan</Label><OptionSelect id="plan-status" value={status} onValueChange={setStatus} options={[{value:"ALL",label:"Semua rencana"},{value:"PENDING",label:"Belum disetujui"},{value:"APPROVED",label:"Sudah disetujui"}]} /></div></div>
    <Table aria-label="Rencana shift per pekerja"><TableHeader><TableRow><TableHead><span className="sr-only">Pilih rencana hijau</span></TableHead><TableHead>Pekerja · status</TableHead><TableHead>Skor P</TableHead><TableHead>Zona</TableHead><TableHead>Batas harian</TableHead><TableHead>Sumber</TableHead><TableHead>Versi</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{plans.map(plan=>{const worker=state.pekerja.find(row=>row.kode===plan.pekerjaKode);const canSelect=eligible.some(row=>row.id===plan.id);return <TableRow key={plan.id}><TableCell><input type="checkbox" aria-label={`Pilih rencana ${worker?.nama}`} disabled={!canSelect || !izin("SETUJUI_RENCANA")} checked={canSelect && selected.includes(plan.id)} onChange={event=>setSelected(previous=>event.target.checked ? [...previous,plan.id] : previous.filter(id=>id!==plan.id))} /></TableCell><TableCell><strong className="font-medium">{worker?.nama}</strong><div className="mt-2">{plan.riskColour ? <RiskBadge colour={plan.riskColour} /> : <StatusChip status={plan.status} />}</div></TableCell><TableCell>{plan.personalScore ?? "—"}</TableCell><TableCell>{ZONA.find(row=>row.kode===plan.zonaKode)?.nama}</TableCell><TableCell>{plan.batasHarianMenit} menit<p className="mt-1 text-xs text-muted-foreground">Jadwal {plan.totalKerjaMenit} menit</p></TableCell><TableCell><QualityBadge kualitas={plan.kualitas} /></TableCell><TableCell>v{plan.version}<p className="mt-1 text-xs text-muted-foreground">{plan.disetujuiOleh ? "Disetujui HSE" : plan.version > 1 ? "Tinjauan ulang" : "Draf"}</p></TableCell><TableCell><Button asChild variant="outline"><Link href={`/pekerja/${plan.pekerjaKode}#rencana`}>Tinjau {worker?.nama}</Link></Button></TableCell></TableRow>})}{!plans.length && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Tidak ada rencana yang cocok dengan filter.</TableCell></TableRow>}</TableBody></Table>
    <p className="text-xs leading-relaxed text-muted-foreground">Status warna dan skor memakai parameter PDF v0. Rencana kuning, merah, prakiraan dan data kurang ditinjau per pekerja. Sumber perkiraan dibedakan dari pengukuran.</p>
    {approved === state.pekerja.length && all.length > 0 && <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-secondary p-5"><div><h2 className="font-semibold">Seluruh versi aktif disetujui</h2><p className="mt-1 text-sm text-muted-foreground">{shift?.status === "DRAFT" ? "Terbitkan shift agar instruksi dapat dibagikan ke regu." : "Instruksi dan riwayat pengiriman dikelola pada modul Instruksi regu."}</p></div>{shift?.status === "DRAFT" ? <ConfirmAction label="Terbitkan shift" guide="publish-shift" disabled={!izin("KELOLA_SHIFT")} title="Terbitkan shift?" description="Versi rencana sudah ditinjau. Data berikutnya dapat memerlukan persetujuan ulang." onConfirm={()=>dispatch({type:"TERBITKAN_SHIFT",shiftId:shift.id})} /> : <Button asChild variant="outline"><Link href="/instruksi">Kelola instruksi regu</Link></Button>}</div>}
  </div>
}

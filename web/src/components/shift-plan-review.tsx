"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { RencanaCard } from "@/components/rencana-card"
import { QualityBadge, RiskBadge, StatusChip } from "@/components/status"
import { ConfirmAction } from "@/components/confirm-action"
import { rencanaAktif, useApp, useIzin } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { scopedWorkspace } from "@/lib/workspace"
import { ZONA, TUGAS } from "@/lib/config"

export function ShiftPlanReview() {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  const [selected,setSelected] = useState<string[]>([])
  const [detail,setDetail] = useState("")
  if (!user) return null
  const state = scopedWorkspace(workspace,user), shift = currentShift(workspace)
  const rank = { MERAH:0, DATA_KURANG:1, KUNING:2, HIJAU:3 }
  const plans = rencanaAktif(state).toSorted((a,b)=>(rank[a.riskColour ?? "DATA_KURANG"]-rank[b.riskColour ?? "DATA_KURANG"]) || Number(!!a.disetujuiOleh)-Number(!!b.disetujuiOleh))
  const approved = plans.filter(plan=>plan.disetujuiOleh).length
  const eligible = plans.filter(plan=>!plan.disetujuiOleh && plan.riskColour === "HIJAU" && plan.intervals.every(row=>row.kualitas === "TERUKUR" || row.kualitas === "REPLAY"))
  const selectedPlans = eligible.filter(plan=>selected.includes(plan.id))
  const opened = plans.find(plan=>plan.pekerjaKode===detail)
  if (!state.rencanaDihitung) return <div className="wizard-empty"><h3>Siapkan draf rencana pagi.</h3><p>Prakiraan dan data pekerja dipakai lebih dahulu. Check-in pada pukul 07.00 dapat memperketat rencana setelah instruksi dibagikan.</p><Button disabled={!izin("HITUNG_RENCANA")} onClick={()=>dispatch({type:"HITUNG_RENCANA"})}>Siapkan rencana pagi</Button></div>
  return <div data-guide="plans" className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="wizard-progress" role="status">{approved}/{state.pekerja.length} rencana disetujui · merah dan data kurang ditampilkan lebih dahulu</p><Button variant="outline" disabled={!izin("SETUJUI_RENCANA") || !selectedPlans.length} onClick={()=>{for(const plan of selectedPlans)dispatch({type:"SETUJUI",rencanaId:plan.id});setSelected([])}}>Setujui hijau terpilih ({selectedPlans.length})</Button></div>
    <Table aria-label="Rencana shift per pekerja"><TableHeader><TableRow><TableHead><span className="sr-only">Pilih rencana hijau</span></TableHead><TableHead>Pekerja · status</TableHead><TableHead>Skor P</TableHead><TableHead>Beban · zona</TableHead><TableHead>Batas harian</TableHead><TableHead>Sumber</TableHead><TableHead>Versi</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{plans.map(plan=>{const worker=state.pekerja.find(row=>row.kode===plan.pekerjaKode);const canSelect=eligible.some(row=>row.id===plan.id);return <TableRow key={plan.id}><TableCell><input type="checkbox" aria-label={`Pilih rencana ${worker?.nama}`} disabled={!canSelect || !izin("SETUJUI_RENCANA")} checked={canSelect && selected.includes(plan.id)} onChange={event=>setSelected(previous=>event.target.checked ? [...previous,plan.id] : previous.filter(id=>id!==plan.id))} /></TableCell><TableCell><strong>{worker?.nama}</strong><div className="mt-2">{plan.riskColour ? <RiskBadge colour={plan.riskColour} /> : <StatusChip status={plan.status} />}</div></TableCell><TableCell className="tabular-nums">{plan.personalScore ?? "—"}</TableCell><TableCell><p>{TUGAS.find(row=>row.kode===plan.tugasKode)?.beban.toLowerCase()}</p><p className="mt-1 text-xs text-muted-foreground">{ZONA.find(row=>row.kode===plan.zonaKode)?.nama}</p></TableCell><TableCell>{plan.batasHarianMenit} menit<p className="mt-1 text-xs text-muted-foreground">Jadwal {plan.totalKerjaMenit} menit</p></TableCell><TableCell><QualityBadge kualitas={plan.kualitas} /></TableCell><TableCell>v{plan.version}<p className="mt-1 text-xs text-muted-foreground">{plan.disetujuiOleh ? "Disetujui HSE" : plan.version > 1 ? "Perlu tinjauan ulang" : "Draf"}</p></TableCell><TableCell><Button variant="outline" onClick={()=>setDetail(plan.pekerjaKode)}>Tinjau {worker?.nama}</Button></TableCell></TableRow>})}</TableBody></Table>
    <p className="text-xs leading-relaxed text-muted-foreground">Rencana kuning, merah, prakiraan, dan data kurang dibuka satu per satu. Status warna dan skor memakai parameter flow PDF v0; sumber perkiraan tetap dibedakan dari pengukuran.</p>
    {opened && <RencanaCard key={opened.id} r={opened} mode="hse" />}
    {approved === state.pekerja.length && plans.length > 0 && <div className="wizard-result"><div><h3>Seluruh versi aktif disetujui.</h3><p>{shift?.status === "DRAFT" ? "Terbitkan untuk membagikan instruksi ke mandor." : "Bagikan pembaruan bila versi rencana berubah."}</p></div>{shift?.status === "DRAFT" && <ConfirmAction label="Terbitkan shift" guide="publish-shift" disabled={!izin("KELOLA_SHIFT")} title="Terbitkan shift?" description="Versi rencana sudah ditinjau. Check-in dan pengukuran berikutnya dapat memerlukan tinjauan ulang." onConfirm={()=>dispatch({type:"TERBITKAN_SHIFT",shiftId:shift.id})} />}</div>}
  </div>
}

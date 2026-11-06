"use client"
import { OptionSelect } from "@/components/ui/option-select"
import { useState } from "react"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { currentBandAllocations } from "@/lib/band-management"
import { hasConsent } from "@/lib/clinic"
import { BAND_UNITS } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { rencanaAktif, useApp } from "@/lib/store"
import { lingkupPekerja } from "@/lib/access"

export function BandWorkspace() {
 const {state,user,dispatch}=useApp()
 const [selected,setSelected]=useState<Record<string,string>>({})
 if (!user || !["HSE","MANDOR"].includes(user.role)) return null
 const shift=currentShift(state)
 if(!shift)return null
 const active=currentBandAllocations(state)
 const workers=lingkupPekerja(user,shift.workspace.pekerja)
 const rank={MERAH:0,KUNING:1,HIJAU:2,DATA_KURANG:3}
 const plans=rencanaAktif(state)
 const priority=workers.filter(worker=>hasConsent(state,worker.kode,"BAND")).toSorted((a,b)=>{const pa=plans.find(row=>row.pekerjaKode===a.kode),pb=plans.find(row=>row.pekerjaKode===b.kode);return rank[pa?.riskColour ?? "DATA_KURANG"]-rank[pb?.riskColour ?? "DATA_KURANG"] || (pb?.personalScore ?? 0)-(pa?.personalScore ?? 0)})
 return <><PageHeader title="Band bergilir" summary="Penugasan, pemakaian, dan pengembalian perangkat." /><div className="grid gap-5 lg:grid-cols-2">{BAND_UNITS.map(bandId=>{const allocation=active.find(row=>row.bandId===bandId);const worker=workers.find(row=>row.kode===allocation?.pekerjaKode);if(user.role==="MANDOR" && !worker)return null;const code=selected[bandId] ?? worker?.kode ?? priority.find(row=>!active.some(item=>item.pekerjaKode===row.kode))?.kode ?? "";return <section key={bandId} className="summon-panel p-5"><h2 className="font-semibold">{bandId}</h2><p className="mt-2 text-sm">{allocation?.dipakaiPada ? `Dipakai ${worker?.nama ?? "pekerja"}` : allocation ? `Menunggu serah-terima · ${worker?.nama}` : "Belum ditugaskan"}</p>{user.role==="HSE" && <div className="mt-5 space-y-3"><Label htmlFor={`band-${bandId}`}>Pemakai (urutan prioritas)</Label><OptionSelect id={`band-${bandId}`} value={code} disabled={shift.status==="CLOSED" || !!allocation?.dipakaiPada} onValueChange={value=>setSelected({...selected,[bandId]:value})} options={[{value:"",label:"Pilih pekerja berizin"},...priority.map(row=>({value:row.kode,label:`${row.nama} · ${plans.find(plan=>plan.pekerjaKode===row.kode)?.riskColour ?? "Data kurang"}`,keywords:row.kode,disabled:active.some(item=>item.pekerjaKode===row.kode && item.bandId!==bandId)}))]} searchPlaceholder="Cari nama atau ID pekerja…" /><Button variant="outline" disabled={!code || shift.status==="CLOSED" || !!allocation?.dipakaiPada} onClick={()=>dispatch({type:"ATUR_BAND",bandId,pekerjaKode:code})}>Tetapkan pemakai</Button></div>}{user.role==="MANDOR" && allocation && <div className="mt-5 flex flex-wrap gap-3">{!allocation.dipakaiPada ? <Button disabled={shift.status!=="ACTIVE"} onClick={()=>dispatch({type:"SERAH_BAND",allocationId:allocation.id})}>Sudah dipakai</Button> : <Button disabled={shift.status!=="ACTIVE"} variant="outline" onClick={()=>dispatch({type:"KEMBALI_BAND",allocationId:allocation.id})}>Dikembalikan & dibersihkan</Button>}</div>}</section>})}</div>{!priority.length && user.role==="HSE" && <p className="mt-5 text-sm text-muted-foreground">Belum ada peserta dengan persetujuan Band aktif. Klinik mencatat persetujuan pekerja sebelum penugasan.</p>}{user.role==="MANDOR" && !active.some(row=>workers.some(worker=>worker.kode===row.pekerjaKode)) && <p className="summon-panel p-6 text-sm">Belum ada Band yang ditugaskan ke regu Anda.</p>}<section className="summon-panel mt-6 p-5"><h2 className="mb-3 font-semibold">Riwayat serah-terima shift</h2>{(shift.bands ?? []).filter(row=>workers.some(worker=>worker.kode===row.pekerjaKode)).map(row=><p className="border-t py-3 text-sm" key={row.id}>{row.bandId} · {workers.find(worker=>worker.kode===row.pekerjaKode)?.nama} · {row.dikembalikanPada ? "Dikembalikan & dibersihkan" : row.dibatalkanPada ? "Penugasan diganti sebelum pemakaian" : row.dipakaiPada ? "Sedang dipakai" : "Ditetapkan HSE"}</p>)}</section></>
}

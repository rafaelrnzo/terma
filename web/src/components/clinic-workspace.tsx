"use client"
import { KidneyReferrals } from "@/components/kidney-referrals"

import { OptionSelect } from "@/components/ui/option-select"
import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { HeartbeatIcon } from "@phosphor-icons/react/dist/csr/Heartbeat"
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { clinicInbox, clinicOf, CONSENT_KINDS, hasConsent, medicalProfileFor, type MedicalProfile } from "@/lib/clinic"
import { managementOf } from "@/lib/management-state"
import { hariIni, REGU } from "@/lib/config"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

function FollowupForm({ code, shiftId }: { code: string; shiftId: string }) {
  const { state, dispatch } = useApp()
  const saved = clinicOf(state).followups.find(row => row.pekerjaKode === code && row.tanggal === shiftId)
  const [status, setStatus] = useState<"PANGGIL" | "DIPERIKSA" | "BATASI">(saved?.status ?? "PANGGIL")
  const [note, setNote] = useState(saved?.catatan ?? "")
  const closed = managementOf(state).shifts.find(shift=>shift.id===shiftId)?.status === "CLOSED"
  return <form className="mt-3 space-y-3" onSubmit={event=>{event.preventDefault(); dispatch({type:"BUKA_SHIFT",shiftId}); dispatch({type:"TINDAK_LANJUT_KLINIK",pekerjaKode:code,status,catatan:note})}}>
    <Label htmlFor={`clinic-status-${code}`}>Tindak lanjut</Label><OptionSelect id={`clinic-status-${code}`} value={status} disabled={closed} onValueChange={setStatus} options={[{value:"PANGGIL",label:"Panggil ke Klinik"},{value:"DIPERIKSA",label:"Sudah diperiksa"},{value:"BATASI",label:"Batasi penugasan hari ini"}] as const} />
    <Label htmlFor={`clinic-note-${code}`}>Catatan privat Klinik</Label><Input id={`clinic-note-${code}`} value={note} disabled={closed} onChange={event=>setNote(event.target.value)} required minLength={5} maxLength={1000} />
    <Button type="submit" disabled={closed || note.trim().length < 5}>Simpan tindak lanjut</Button>{closed && <p className="text-xs text-muted-foreground">Riwayat shift sudah ditutup.</p>}
  </form>
}

function ProfileForm({ code }: { code: string }) {
  const { state, user, dispatch } = useApp()
  const existing = user ? medicalProfileFor(state,user,code) : undefined
  const [profile,setProfile] = useState<Omit<MedicalProfile,"waktu">>(existing ?? {pekerjaKode:code,hipertensi:false,diabetes:false,jantung:false,riwayatPanas:false,obatBerisiko:false,catatan:""})
  if (!hasConsent(state,code,"MCU")) return <p className="inline-note">Aktifkan persetujuan MCU untuk membuka profil medis.</p>
  function save(event: FormEvent) { event.preventDefault(); dispatch({type:"SIMPAN_PROFIL_MEDIS",input:profile}) }
  return <form className="space-y-4" onSubmit={save}>
    <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="clinic-birth">Tanggal lahir</Label><Input id="clinic-birth" type="date" value={profile.tanggalLahir ?? ""} max={hariIni()} onChange={event=>setProfile({...profile,tanggalLahir:event.target.value || undefined})} /></div>{([['tinggiCm','Tinggi (cm)',50,250],['beratKg','Berat (kg)',20,350]] as const).map(([key,label,min,max])=><div className="space-y-2" key={key}><Label htmlFor={`clinic-${key}`}>{label}</Label><Input id={`clinic-${key}`} type="number" step="0.1" min={min} max={max} value={profile[key] ?? ""} onChange={event=>setProfile({...profile,[key]:event.target.value ? Number(event.target.value) : undefined})} /></div>)}</div>
    <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-3 text-sm font-medium">Flag dari pemeriksa</legend>{([['hipertensi','Hipertensi'],['diabetes','Diabetes'],['jantung','Kondisi jantung'],['riwayatPanas','Riwayat sakit akibat panas']] as const).map(([key,label])=><label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" checked={profile[key]} onChange={event=>setProfile({...profile,[key]:event.target.checked})} />{label}</label>)}{hasConsent(state,code,"OBAT") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profile.obatBerisiko} onChange={event=>setProfile({...profile,obatBerisiko:event.target.checked})} />Obat berisiko menurut pemeriksa</label>}</fieldset>
    <div className="space-y-2"><Label htmlFor="clinic-profile-note">Catatan pemeriksa (privat)</Label><Input id="clinic-profile-note" value={profile.catatan} maxLength={1000} onChange={event=>setProfile({...profile,catatan:event.target.value})} /></div>
    <Button type="submit">Simpan profil Klinik</Button>
  </form>
}

export function ClinicWorkspace() {
  const { state,user,dispatch } = useApp()
  const [date,setDate] = useState(hariIni)
  const [selected,setSelected] = useState("")
  const [section,setSection] = useState("inbox")
  const profileCode = managementOf(state).workers.find(row=>row.kode===selected)?.kode ?? managementOf(state).workers[0]?.kode
  useEffect(()=>{ if (user?.role === "KLINIK" && section === "profiles" && profileCode) dispatch({type:"AKSES_PROFIL_MEDIS",pekerjaKode:profileCode}) },[user?.role,section,profileCode,dispatch])
  if (!user || user.role !== "KLINIK") return <PageHeader title="Tidak punya akses" summary="Kotak masuk dan data medis hanya tersedia untuk akun Klinik." />
  const workers = managementOf(state).workers
  const worker = workers.find(row=>row.kode===selected) ?? workers[0]
  const inbox = clinicInbox(state,user,date)
  const kinds = {MCU:"Ringkasan MCU",OBAT:"Obat",BAND:"Data Band"}
  return <><PageHeader title="Klinik pekerja" summary="Check-in, persetujuan, dan pemeriksaan pekerja." />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="summon-panel p-5"><HeartbeatIcon size={24} className="mb-3 text-primary" /><p className="text-2xl font-semibold">{inbox.length}</p><p className="mt-1 text-sm text-muted-foreground">Check-in perlu ditindaklanjuti</p></div><div className="summon-panel p-5"><ShieldCheckIcon size={24} className="mb-3 text-primary" /><p className="text-2xl font-semibold">{workers.filter(row=>hasConsent(state,row.kode,"MCU")).length}/{workers.length}</p><p className="mt-1 text-sm text-muted-foreground">Persetujuan MCU aktif</p></div><Link href="/laporan/bulanan" className="summon-panel p-5"><h2 className="font-semibold">Evaluasi paparan bulanan</h2><p className="mt-3 text-sm text-muted-foreground">Rekap durasi terverifikasi →</p></Link></div>
    <div className="mb-5 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="clinic-view">Tampilan Klinik</Label><OptionSelect id="clinic-view" value={section} onValueChange={setSection} options={[{value:"inbox",label:"Kotak masuk kondisi tubuh"},{value:"profiles",label:"Persetujuan & profil pekerja"}]} /></div><div className="space-y-2"><Label htmlFor="clinic-date">Tanggal check-in</Label><Input id="clinic-date" type="date" value={date} onChange={event=>{if(event.target.value)setDate(event.target.value)}} /></div></div>
    {section === "inbox" ? <section className="summon-panel"><div className="panel-heading"><h2>Kotak masuk · {tanggalLabel(date)}</h2></div>{inbox.length ? inbox.map(({worker:person,checkin,shiftId,followup})=><article key={`${shiftId}:${checkin.pekerjaKode}`} className="border-b p-5 last:border-b-0"><h3 className="font-semibold">{person?.nama ?? checkin.pekerjaKode} <span className="text-sm font-normal text-muted-foreground">· {REGU.find(row=>row.kode===person?.reguKode)?.nama}</span></h3><p className="mt-2 text-sm">{checkin.kondisi === "KURANG_BUGAR" ? "Kurang bugar" : "Ada keluhan"} · {checkin.keluhan.join(", ") || "Tanpa rincian keluhan"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(checkin.waktu).toLocaleString("id-ID")} · {followup ? "Tindak lanjut tercatat" : "Belum ditindaklanjuti"}</p><FollowupForm key={`${shiftId}:${checkin.pekerjaKode}`} code={checkin.pekerjaKode} shiftId={shiftId} /></article>) : <p className="p-6 text-sm text-muted-foreground">Tidak ada jawaban kurang bugar atau keluhan pada tanggal ini.</p>}</section> : <section className="summon-panel p-5"><h2 className="mb-4 font-semibold">Persetujuan & profil medis</h2>{!worker ? <p>Belum ada data pekerja.</p> : <><div className="mb-5 space-y-2"><Label htmlFor="clinic-worker">Pekerja</Label><OptionSelect id="clinic-worker" value={worker.kode} onValueChange={setSelected} options={workers.map(row=>({value:row.kode,label:`${row.nama} · ${row.kode}`}))} searchPlaceholder="Cari nama atau ID pekerja…" /></div><p className="mb-4 text-sm text-muted-foreground">Persetujuan tertulis per jenis data.</p><Table aria-label="Persetujuan pekerja"><TableHeader><TableRow><TableHead>Jenis</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{CONSENT_KINDS.map(kind=><TableRow key={kind}><TableCell>{kinds[kind]}</TableCell><TableCell>{hasConsent(state,worker.kode,kind) ? "Aktif" : "Tidak aktif"}</TableCell><TableCell><Button variant="outline" onClick={()=>dispatch({type:"PERSETUJUAN_MEDIS",pekerjaKode:worker.kode,jenis:kind,aktif:!hasConsent(state,worker.kode,kind)})}>{hasConsent(state,worker.kode,kind) ? "Cabut persetujuan" : "Catat persetujuan"}</Button></TableCell></TableRow>)}</TableBody></Table><div className="mt-6 border-t pt-5"><ProfileForm key={`${worker.kode}:${hasConsent(state,worker.kode,"MCU")}:${hasConsent(state,worker.kode,"OBAT")}`} code={worker.kode} /></div></>}</section>}
    <KidneyReferrals />
  </>
}

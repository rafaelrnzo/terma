"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { CheckCircleIcon, IdentificationCardIcon, HeartbeatIcon, ArrowLeftIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wordmark } from "@/components/wordmark"
import { hariIni } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { BODY_COMPLAINTS, type BodyCondition, type BodyComplaint } from "@/lib/worker-readiness"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

const conditions: { value: BodyCondition; label: string; detail: string }[] = [
  { value: "BAIK", label: "Merasa baik", detail: "Tidak ada keluhan saat ini" },
  { value: "KURANG_BUGAR", label: "Kurang bugar", detail: "Merasa lelah atau kurang fit" },
  { value: "ADA_KELUHAN", label: "Ada keluhan", detail: "Saya perlu menyampaikan keluhan" },
]

export default function KioskPage() {
  const { state, ready, dispatch } = useApp()
  const shift = currentShift(state)
  const [code, setCode] = useState("")
  const [identified, setIdentified] = useState("")
  const [condition, setCondition] = useState<BodyCondition | null>(null)
  const [complaints, setComplaints] = useState<BodyComplaint[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const worker = state.pekerja.find(row => row.kode === identified)
  const saved = shift?.readiness?.checkins.find(row => row.pekerjaKode === identified)
  const locked = !shift?.readiness || shift.status !== "DRAFT" || shift.tanggal > hariIni() || state.rencana.some(plan => plan.disetujuiOleh)
  function identify(event: FormEvent) {
    event.preventDefault()
    const found = state.pekerja.find(row => row.kode.toLocaleUpperCase() === code.trim().toLocaleUpperCase())
    if (!found) { setError("ID tidak terdaftar pada shift ini. Hubungi petugas data."); return }
    setIdentified(found.kode)
    setError("")
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!condition || condition === "ADA_KELUHAN" && !complaints.length) { setError("Pilih kondisi tubuh dan keluhan yang dirasakan."); return }
    dispatch({ type: "CATAT_CHECKIN", pekerjaKode: identified, kondisi: condition, keluhan: condition === "BAIK" ? [] : complaints })
    setSubmitted(true)
    setError("")
  }
  function reset() { setCode(""); setIdentified(""); setCondition(null); setComplaints([]); setSubmitted(false); setError("") }
  return <main className="kiosk-page"><header><Wordmark /><span>ABSEN PEKERJA</span></header><div className="kiosk-card summon-panel">
    {!ready ? <p role="status">Memuat shift…</p> : locked ? <><h1>Absen belum dibuka</h1><p>HSE perlu membuka draft shift sebelum pekerja mengisi absen dan kondisi awal. Jika rencana sudah disetujui, hubungi HSE untuk tindak lanjut.</p><Button asChild variant="outline"><Link href="/ringkasan">Kembali ke ruang kerja</Link></Button></> : submitted && saved && state.notice?.tipe !== "error" ? <div role="status" className="kiosk-success"><CheckCircleIcon size={56} weight="fill" /><h1>Absen tercatat, {worker?.nama}.</h1><p>{saved.kondisi === "BAIK" ? "Terima kasih sudah mengisi kondisi awal. Tunggu arahan kerja dari HSE dan mandor." : "Kondisi Anda masuk daftar tinjauan HSE. Sampaikan keluhan kepada petugas sebelum mulai bekerja."}</p><small>{new Date(saved.waktu).toLocaleString("id-ID")}</small><Button onClick={reset}>Pekerja berikutnya</Button></div> : <>
      <p className="eyebrow">{shift.nama} · {tanggalLabel(shift.tanggal)}</p><h1>{worker ? `Bagaimana kondisi tubuh Anda, ${worker.nama}?` : "Absen sebelum mulai kerja"}</h1><p>{worker ? "Jawab sesuai yang Anda rasakan saat ini. Jawaban akan ditinjau HSE." : "Masukkan ID pekerja, lalu isi kondisi tubuh Anda. Tidak perlu berganti akun petugas."}</p>
      {!worker ? <form onSubmit={identify} className="space-y-4"><IdentificationCardIcon size={40} className="text-primary" /><div className="space-y-2"><Label htmlFor="worker-checkin-id">ID pekerja</Label><Input id="worker-checkin-id" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} placeholder="Masukkan ID pekerja" required /></div><Button type="submit" className="w-full">Lanjut ke kondisi tubuh</Button></form> : <form onSubmit={submit} className="space-y-5"><fieldset><legend className="sr-only">Kondisi tubuh hari ini</legend><div className="condition-options">{conditions.map(option => <label key={option.value} data-selected={condition === option.value}><input type="radio" name="body-condition" checked={condition === option.value} onChange={() => { setCondition(option.value); setComplaints([]) }} /><HeartbeatIcon size={25} weight={condition === option.value ? "fill" : "regular"} /><strong>{option.label}</strong><small>{option.detail}</small></label>)}</div></fieldset>{condition && condition !== "BAIK" && <fieldset className="complaint-options"><legend>Keluhan yang dirasakan {condition === "KURANG_BUGAR" && "(bila ada)"}</legend>{BODY_COMPLAINTS.map(complaint => <label key={complaint}><input type="checkbox" checked={complaints.includes(complaint)} onChange={event => setComplaints(previous => event.target.checked ? [...previous, complaint] : previous.filter(value => value !== complaint))} />{complaint}</label>)}</fieldset>}<p className="text-sm text-muted-foreground">Dengan menyimpan, Anda mencatat kehadiran dan kondisi tubuh awal pada shift ini. Jawaban Anda tidak menetapkan kelayakan kerja.</p><Button type="submit" className="w-full" disabled={!condition}>Simpan absen & kondisi tubuh</Button><Button type="button" variant="ghost" onClick={reset}><ArrowLeftIcon />Ganti ID pekerja</Button></form>}
      {(error || submitted && state.notice?.tipe === "error") && <p role="alert" className="mt-4 text-sm text-destructive">{error || state.notice?.pesan}</p>}
    </>}
  </div><footer>TERMA · Check-in kondisi awal<Link href="/ringkasan">Kembali ke ruang petugas</Link></footer></main>
}

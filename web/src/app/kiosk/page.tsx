"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircleIcon, CheckIcon, ArrowLeftIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { KioskIdentity } from "@/components/kiosk/kiosk-identity"
import { KioskQuestions } from "@/components/kiosk/kiosk-questions"
import { hariIni } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { CHECKIN_METHOD_LABEL, type CheckinMethod } from "@/lib/kiosk-entry"
import type { BodyCondition, BodyComplaint } from "@/lib/worker-readiness"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

function KioskSession() {
  const { state, dispatch } = useApp()
  const shift = currentShift(state)
  const [identification, setIdentification] = useState<{ code: string; method: CheckinMethod } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const worker = state.pekerja.find(row => row.kode === identification?.code)
  const saved = shift?.readiness?.checkins.find(row => row.pekerjaKode === worker?.kode)
  const success = submitted && saved && state.notice?.tipe !== "error"
  const step = success ? 2 : worker ? 1 : 0
  function reset() { setIdentification(null); setSubmitted(false) }
  function submit(condition: BodyCondition, complaints: BodyComplaint[]) {
    if (!identification) return
    dispatch({ type: "CATAT_CHECKIN", pekerjaKode: identification.code, kondisi: condition, keluhan: complaints, metode: identification.method })
    setSubmitted(true)
  }
  if (!shift) return null
  return <>
    <div className="kiosk-shift-label"><span className="status-dot" /><span>{shift.nama}</span><span>{tanggalLabel(shift.tanggal)}</span></div>
    <ol className="kiosk-progress" aria-label="Langkah absen">{["Identitas", "Kondisi tubuh", "Selesai"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} data-done={step > index}><span>{step > index ? <CheckIcon size={13} /> : index + 1}</span>{label}</li>)}</ol>
    {success ? <div role="status" className="kiosk-success"><CheckCircleIcon size={56} weight="fill" /><h1>Absen tercatat, {worker?.nama}.</h1><p>{saved.kondisi === "BAIK" ? "Terima kasih. Tunggu arahan kerja dari HSE dan mandor." : "Kondisi Anda masuk daftar tinjauan HSE. Sampaikan keluhan kepada petugas sebelum mulai bekerja."}</p><div className="kiosk-receipt"><span>{saved.metode ? CHECKIN_METHOD_LABEL[saved.metode] : "Check-in pekerja"}</span><strong>{new Date(saved.waktu).toLocaleString("id-ID")}</strong><small>Kehadiran dan jawaban kondisi awal tersimpan.</small></div><Button className="w-full" onClick={reset}>Pekerja berikutnya</Button></div> : worker && identification ? <>
      <div className="kiosk-step-heading"><p className="eyebrow">{CHECKIN_METHOD_LABEL[identification.method]}</p><h1>Bagaimana kondisi tubuh Anda, {worker.nama}?</h1><p>Pilih yang Anda rasakan sekarang. Satu jawaban sebelum mulai bekerja.</p></div>
      <KioskQuestions onSave={submit} onBack={reset} />
      {submitted && state.notice?.tipe === "error" && <p role="alert" className="mt-4 text-sm text-destructive">{state.notice.pesan}</p>}
    </> : <><div className="kiosk-step-heading"><p className="eyebrow">CHECK-IN SEBELUM KERJA</p><h1>Absen mudah, pilih caranya.</h1><p>Via kamera atau tap kartu. Setelah itu, isi kondisi tubuh Anda.</p></div><KioskIdentity workers={state.pekerja} onIdentified={(code, method) => { setIdentification({ code, method }); setSubmitted(false) }} /></>}
  </>
}

export default function KioskPage() {
  const { state, ready } = useApp()
  const shift = currentShift(state)
  const locked = !shift?.readiness || shift.status !== "DRAFT" || shift.tanggal > hariIni() || state.rencana.some(plan => plan.disetujuiOleh)
  return <main className="kiosk-page"><header><Wordmark /><span>ABSEN PEKERJA</span></header><div className="kiosk-card summon-panel">
    {!ready ? <p role="status">Memuat shift…</p> : locked ? <div className="kiosk-locked"><h1>Absen belum dibuka</h1><p>HSE perlu membuka draft shift sebelum pekerja mengisi absen dan kondisi awal. Jika rencana sudah disetujui, hubungi HSE untuk tindak lanjut.</p><Button asChild variant="outline"><Link href="/ringkasan"><ArrowLeftIcon />Kembali ke ruang kerja</Link></Button></div> : <KioskSession key={shift.id} />}
  </div><footer>TERMA · Check-in kondisi awal<Link href="/ringkasan">Kembali ke ruang petugas</Link></footer></main>
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { KioskIdentity } from "@/components/kiosk/kiosk-identity"
import { KioskCheckout } from "@/components/kiosk/kiosk-checkout"
import { KioskQuestions } from "@/components/kiosk/kiosk-questions"
import { hariIni } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { CHECKIN_METHOD_LABEL, type CheckinMethod } from "@/lib/kiosk-entry"
import type { BodyCondition, BodyComplaint } from "@/lib/worker-readiness"
import { RiskBadge } from "@/components/status"
import { rencanaAktif, useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

function KioskSession({ onCheckout }: { onCheckout: () => void }) {
  const { state, user, dispatch } = useApp()
  const shift = currentShift(state)
  const fixedCode = user?.role === "PEGAWAI" ? user.pekerjaKode : undefined
  const [identification, setIdentification] = useState<{ code: string; method: CheckinMethod } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [consent, setConsent] = useState(false)
  const worker = state.pekerja.find(row => row.kode === identification?.code)
  const saved = shift?.readiness?.checkins.find(row => row.pekerjaKode === worker?.kode)
  const ownCheckin = fixedCode && shift?.readiness?.checkins.find(row => row.pekerjaKode === fixedCode)
  const success = submitted && saved && state.notice?.tipe !== "error"
  const previousConsent = state.management?.shifts.some(row=>row.readiness?.checkins.some(checkin=>checkin.pekerjaKode===worker?.kode && checkin.persetujuan))
  const ownPlan = rencanaAktif(state).find(plan=>plan.pekerjaKode===worker?.kode)
  useEffect(()=>{ if (!success) return; const timer=setTimeout(()=>{setIdentification(null);setSubmitted(false);setConsent(false)},4000); return ()=>clearTimeout(timer) },[success])
  const step = success ? 2 : worker ? 1 : 0
  function reset() { setIdentification(null); setSubmitted(false); setConsent(false) }
  function submit(condition: BodyCondition, complaints: BodyComplaint[]) {
    if (!identification) return
    dispatch({ type: "CATAT_CHECKIN", pekerjaKode: identification.code, kondisi: condition, keluhan: complaints, metode: identification.method, persetujuan: consent || previousConsent })
    setSubmitted(true)
  }
  if (!shift) return null
  return <>
    <div className="kiosk-shift-label"><span className="status-dot" /><span>{shift.nama}</span><span>{tanggalLabel(shift.tanggal)}</span></div>
    <ol className="kiosk-progress" aria-label="Langkah absen">{["Identitas", "Kondisi tubuh", "Selesai"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} data-done={step > index}><span>{step > index ? <CheckIcon size={13} /> : index + 1}</span>{label}</li>)}</ol>
    {success ? <div role="status" className="kiosk-success" data-risk={ownPlan?.riskColour}><CheckCircleIcon size={56} weight="fill" /><h1>Absen tercatat, {worker?.nama}.</h1>{ownPlan?.riskColour && <RiskBadge colour={ownPlan.riskColour} />}<p>{saved.kondisi === "BAIK" ? "Terima kasih. Ikuti jadwal kerja dan arahan mandor." : "Jawaban Anda masuk kotak masuk Klinik. Sampaikan keluhan langsung kepada petugas Klinik."}</p><div className="kiosk-receipt"><span>{saved.metode ? CHECKIN_METHOD_LABEL[saved.metode] : "Check-in pekerja"}</span><strong>{new Date(saved.waktu).toLocaleString("id-ID")}</strong><small>Kehadiran dan jawaban kondisi awal tersimpan.</small></div><Button className="w-full" onClick={fixedCode ? onCheckout : reset}>{fixedCode ? "Lanjut ke absen pulang" : "Pekerja berikutnya"}</Button></div> : fixedCode && ownCheckin ? <div role="status" className="kiosk-success"><CheckCircleIcon size={48} weight="fill" /><h1>Absen masuk Raya sudah tercatat.</h1><div className="kiosk-receipt"><span>{ownCheckin.metode ? CHECKIN_METHOD_LABEL[ownCheckin.metode] : "Check-in pekerja"}</span><strong>{new Date(ownCheckin.waktu).toLocaleString("id-ID")}</strong><small>{ownCheckin.pulang ? `Pulang tercatat ${new Date(ownCheckin.pulang).toLocaleString("id-ID")}` : "Siap mencatat jam pulang setelah bekerja."}</small></div>{!ownCheckin.pulang && <Button className="w-full" onClick={onCheckout}>Catat absen pulang</Button>}</div> : worker && identification && !consent && !previousConsent ? <div className="space-y-5"><h1 className="text-2xl font-semibold">Persetujuan check-in</h1><ul className="space-y-1 text-sm"><li>Jawaban hanya dibaca Klinik.</li><li>Tidak dipakai untuk menilai kinerja atau upah.</li></ul><Button className="w-full" onClick={()=>setConsent(true)}>Saya setuju & lanjut</Button><Button variant="ghost" onClick={reset}>Kembali</Button></div> : worker && identification ? <>
      <div className="kiosk-step-heading"><p className="eyebrow">{CHECKIN_METHOD_LABEL[identification.method]}</p><h1>Bagaimana kondisi tubuh Anda, {worker.nama}?</h1><p>Pilih yang Anda rasakan sekarang. Satu jawaban sebelum mulai bekerja.</p></div>
      <KioskQuestions onSave={submit} onBack={reset} />
      {submitted && state.notice?.tipe === "error" && <p role="alert" className="mt-4 text-sm text-destructive">{state.notice.pesan}</p>}
    </> : <><div className="kiosk-step-heading"><p className="eyebrow">CHECK-IN SEBELUM KERJA</p><h1>Absen mudah, pilih caranya.</h1><p>{fixedCode ? "Raya sudah dikenali dari akun yang masuk. Buka kamera atau coba tap kartu demo, lalu isi kondisi tubuh." : "Via kamera atau tap kartu. Setelah itu, isi kondisi tubuh Anda."}</p></div><KioskIdentity workers={state.pekerja} checkedIn={new Set(shift?.readiness?.checkins.map(row => row.pekerjaKode) ?? [])} fixedCode={fixedCode} onIdentified={(code, method) => { setIdentification({ code, method }); setSubmitted(false) }} /></>}
  </>
}

export default function KioskPage() {
  const { state, user, ready } = useApp()
  const [mode, setMode] = useState<"masuk" | "pulang">("masuk")
  const shift = currentShift(state)
  const locked = !shift?.readiness || shift.status === "CLOSED" || shift.tanggal > hariIni() || (user?.role === "PEGAWAI" && shift.tanggal !== hariIni())
  return <main className="kiosk-page"><header><Wordmark /><span>ABSEN PEKERJA</span></header><div className="kiosk-card summon-panel">
    {!ready ? <p role="status">Memuat shift…</p> : !user ? <div className="kiosk-locked"><h1>Masuk untuk absen</h1><p>Gunakan akun Raya agar identitas demo terisi otomatis.</p><Button asChild><Link href="/">Ke halaman masuk</Link></Button></div> : locked ? <div className="kiosk-locked"><h1>Absen belum dibuka</h1><p>Petugas membuka shift tanggal ini sebelum check-in. Absen tetap tersedia setelah rencana disetujui, sampai shift ditutup.</p><Button asChild variant="outline"><Link href="/ringkasan"><ArrowLeftIcon />Kembali ke ruang kerja</Link></Button></div> : <><div className="mb-5 flex gap-2" role="group" aria-label="Jenis absen">{(["masuk", "pulang"] as const).map(value => <Button key={value} size="sm" variant={mode === value ? "default" : "outline"} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === "masuk" ? "Absen masuk" : "Absen pulang"}</Button>)}</div>{mode === "masuk" ? <KioskSession key={shift.id} onCheckout={() => setMode("pulang")} /> : <KioskCheckout />}</>}
  </div><footer>TERMA · Check-in kondisi awal<Link href="/ringkasan">Kembali ke ruang petugas</Link></footer></main>
}

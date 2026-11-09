"use client"

import { useState } from "react"
import { PageHeader } from "@/components/app-shell"
import { KioskQuestions } from "@/components/kiosk/kiosk-questions"
import { Button } from "@/components/ui/button"
import { hariIni } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

export default function EmployeeAttendancePage() {
  const { state, user, dispatch, ready } = useApp()
  const [consent, setConsent] = useState(false)
  if (!ready || !user || user.role !== "PEGAWAI") return null

  const worker = state.pekerja.find(row => row.kode === user.pekerjaKode)
  const shift = currentShift(state)
  const checkin = shift?.readiness?.checkins.find(row => row.pekerjaKode === user.pekerjaKode)
  const open = !!worker && !!shift?.readiness && shift.tanggal === hariIni() && shift.status !== "CLOSED"

  return <div className="mx-auto max-w-2xl space-y-6">
    <PageHeader title="Absensi saya" summary={worker ? `${worker.nama} · ${worker.kode}` : "Akun pegawai demo"} />
    {!worker ? <section className="summon-panel p-6"><h2 className="font-semibold">Data pekerja belum tersedia</h2><p className="mt-2 text-sm text-muted-foreground">Minta admin menambahkan pekerja yang terhubung dengan akun ini.</p></section>
      : !open ? <section className="summon-panel p-6"><h2 className="font-semibold">Absen belum dibuka</h2><p className="mt-2 text-sm text-muted-foreground">{shift ? `Shift aktif ${shift.nama} bertanggal ${tanggalLabel(shift.tanggal)}.` : "Belum ada shift aktif."} Minta HSE atau admin menyiapkan shift hari ini.</p></section>
      : <section className="summon-panel space-y-5 p-6">
        <div><p className="eyebrow">{shift.nama} · {tanggalLabel(shift.tanggal)}</p><h2 className="mt-2 font-heading text-xl font-semibold">{checkin ? "Kehadiran Anda" : "Absen masuk"}</h2></div>
        {checkin ? <>
          <p role="status" className="text-sm">Absen masuk tercatat pukul <strong>{new Date(checkin.waktu).toLocaleTimeString("id-ID")}</strong>.</p>
          {checkin.pulang ? <p role="status" className="text-sm">Absen pulang tercatat pukul <strong>{new Date(checkin.pulang).toLocaleTimeString("id-ID")}</strong>.</p>
            : <Button onClick={() => dispatch({ type: "CATAT_PULANG", pekerjaKode: worker.kode })}>Catat absen pulang</Button>}
        </> : <>
          <p className="text-sm text-muted-foreground">Isi kondisi tubuh sebelum mulai bekerja. Jawaban hanya tersedia untuk Klinik.</p>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={event => setConsent(event.target.checked)} /><span>Saya setuju jawaban kondisi digunakan untuk keselamatan kerja.</span></label>
          {consent && <KioskQuestions onSave={(kondisi, keluhan) => dispatch({ type: "CATAT_CHECKIN", pekerjaKode: worker.kode, kondisi, keluhan, persetujuan: true })} />}
        </>}
      </section>}
  </div>
}

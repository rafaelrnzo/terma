"use client"

import Link from "next/link"
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { hariIni } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

export default function EmployeeAttendancePage() {
  const { state, user, ready } = useApp()
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
        <div><h2 className="font-heading text-xl font-semibold">{checkin ? "Kehadiran Raya" : "Siap absen, Raya?"}</h2><p className="mt-2 text-sm text-muted-foreground">{shift.nama} · {tanggalLabel(shift.tanggal)}</p></div>
        {checkin && <p role="status" className="text-sm">Masuk tercatat pukul <strong>{new Date(checkin.waktu).toLocaleTimeString("id-ID")}</strong>{checkin.pulang ? `, pulang pukul ${new Date(checkin.pulang).toLocaleTimeString("id-ID")}.` : "."}</p>}
        {!checkin?.pulang && <Button asChild><Link href="/kiosk"><CameraIcon />{checkin ? "Catat absen pulang" : "Absen via kamera atau kartu"}<ArrowRightIcon /></Link></Button>}
        <p className="text-xs text-muted-foreground">Kamera menampilkan pratinjau. Tap kartu adalah simulasi; identitas mengikuti akun Raya yang masuk.</p>
      </section>}
  </div>
}

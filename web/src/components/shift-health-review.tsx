"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { lingkupPekerja } from "@/lib/access"

export const HEALTH_STATUS_LABEL = { TANPA_PEMBATASAN: "Tanpa pembatasan pada dokumen", DENGAN_PEMBATASAN: "Ada pembatasan kerja", PERLU_TINJAU: "Perlu tindak lanjut" }

/** Operational attendance only. Clinical answers never appear on the HSE/admin/foreman surface. */
export function ShiftHealthReview() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  if (!shift || !user) return null
  const workers = lingkupPekerja(user, shift.workspace.pekerja)
  const checked = workers.filter(worker => shift.readiness?.checkins.some(row => row.pekerjaKode === worker.kode)).length
  return <section className="health-review" data-guide="health-checkin"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Kehadiran pada shift</h2><p className="mt-2 text-sm text-muted-foreground">{checked}/{workers.length} peserta sudah check-in. Jawaban kondisi hanya untuk Klinik.</p></div><Button asChild variant="outline"><Link href={user.role === "KLINIK" ? "/klinik" : "/kiosk"}>{user.role === "KLINIK" ? "Buka kotak masuk Klinik" : "Buka layar absen"}</Link></Button></div><div className="mt-4 divide-y">{workers.map(worker => <div key={worker.kode} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><strong>{worker.nama}</strong><span>{shift.readiness?.checkins.some(row => row.pekerjaKode === worker.kode) ? "Check-in tercatat" : "Belum check-in"}</span></div>)}</div>{!shift.readiness && <p className="text-sm text-muted-foreground">Shift lama ini belum memiliki pencatatan check-in. Riwayat tidak diisi secara otomatis.</p>}</section>
}

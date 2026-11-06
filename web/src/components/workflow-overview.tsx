"use client"

import Link from "next/link"
import { ClockIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { useApp } from "@/lib/store"
import type { ShiftRecord } from "@/lib/management-types"

export function WorkflowOverview({ shift }: { shift?: ShiftRecord }) {
  const { user } = useApp()
  const hub = shift ? `/shift/${shift.id}` : "/ringkasan"
  const steps = [
    ["05.30","Persiapan & draf","Admin Data · Sistem","Data HR, absensi kemarin, penugasan dan prakiraan menjadi draf pagi.",user?.role === "PETUGAS_DATA" ? "/impor" : hub],
    ["06.30","HSE menyetujui","HSE","Tinjau merah/kuning, batas aklimatisasi dan versi rencana.",hub],
    ["06.45","Instruksi regu","HSE → Mandor","Bagikan versi disetujui; mandor mengakui penerapan jadwal.",hub],
    ["07.00","Check-in pekerja","Pekerja → Klinik","Scan identitas, jawab kondisi. Alasan kurang sehat hanya untuk Klinik.",user?.role === "KLINIK" ? "/klinik" : "/kiosk"],
    ["Sepanjang shift","Pantau & perbarui","Mandor · HSE","Bacaan zona, kunjungan minum dan Band; perketatan kembali ke HSE.",user?.role === "PETUGAS_DATA" ? "/perangkat" : "/monitoring"],
    ["17.00","Lapor & verifikasi","Mandor → HSE","Catat menit aktual, periksa selisih, verifikasi dan tutup.",hub],
    ["Bulanan","Evaluasi paparan","Klinik","Akumulasi paparan dan tindak lanjut pemeriksaan.","/kesehatan"],
  ]
  return <section className="summon-panel mb-6" data-guide="workflow-map" aria-labelledby="day-flow-title"><div className="panel-heading"><div><p className="eyebrow"><ClockIcon size={15} aria-hidden />SATU HARI DENGAN TERMA</p><h2 id="day-flow-title">Rencana dahulu, check-in saat pekerja datang.</h2></div></div><ol className="day-flow">{steps.map(([time,title,actor,description,href])=><li key={time}><span className="font-mono text-xs text-primary">{time}</span><h3 className="mt-2 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{actor}</p><p className="mt-3 text-sm leading-relaxed">{description}</p><Link href={href} className="panel-link mt-3">Buka<ArrowRightIcon size={14} aria-hidden /></Link></li>)}</ol><p className="border-t px-5 py-4 text-xs leading-relaxed text-muted-foreground">Waktu mengikuti diagram alur. Pembacaan perangkat dan keputusan dicatat saat tersedia; persetujuan tidak dijalankan otomatis.</p></section>
}

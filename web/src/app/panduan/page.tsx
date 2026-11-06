"use client"

import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { GuideButton } from "@/components/workflow-guide"
import { Button } from "@/components/ui/button"
import { currentShift } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { useApp } from "@/lib/store"

const tasks = [
  ["Data & adaptasi · 05.30", "Admin Data menyiapkan HR dan penugasan; HSE mengonfirmasi riwayat adaptasi. Draf memakai prakiraan pagi. Check-in belum menjadi syarat persetujuan."],
  ["Cuaca & bacaan zona", "Prakiraan berlabel dipakai untuk persiapan. Pengukuran yang tersedia memperbarui rencana; tugas ini dapat dipantau kapan saja."],
  ["Rencana", "Hitung dan tinjau setiap rencana. Setelah seluruhnya disetujui, terbitkan shift."],
  ["Instruksi", "HSE membagikan instruksi ke regu dan mencatat pembagian. Mandor membaca serta mengakui penerimaan."],
  ["Pelaksanaan", "Mandor mengisi pelaksana, waktu, dan menit aktual. Laporan yang dikembalikan diperbaiki pada tugas ini."],
  ["Verifikasi & tutup", "HSE memeriksa laporan dan menutup shift. Laporan akhir tersedia setelah catatan dikunci."],
]

export default function PanduanPage() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  const flow = user && shift ? shiftTaskFlow(state,user) : null
  return <>
    <PageHeader title="Cara menjalankan satu shift" summary="Mulai dari data pekerja, ringkasan kesehatan perusahaan, dan satu draft shift. Selanjutnya kerjakan enam tugas dalam halaman shift yang sama." />
    <section className="summon-panel mb-6 p-6"><h2 className="text-lg font-semibold">Urutan pagi dan pemantauan berjalan.</h2><p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">05.30 siapkan draf; 06.30 HSE menyetujui; 06.45 instruksi diterima mandor; 07.00 pekerja check-in. Jawaban kurang sehat hanya masuk Klinik. Jika data baru memperketat rencana, HSE meninjau versi baru sebelum pembaruan dibagikan.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href={shift ? `/shift/${shift.id}` : "/ringkasan"}>{shift ? "Lanjutkan shift" : "Mulai dari shift kerja"}<ArrowRightIcon /></Link></Button><GuideButton mode="journey" label="Tunjukkan alurnya" /></div></section>
    <section className="summon-panel p-6"><h2 className="mb-4 text-sm font-semibold">Urutan kerja</h2><ol className="flow-step-list">{tasks.map(([title,description],index) => <li key={title}><div><strong>{title}</strong><p>{description}</p>{flow && <p className="text-xs text-muted-foreground">{flow.steps[index].done ? "Selesai" : flow.steps[index].progress}</p>}</div></li>)}</ol></section>
    <section className="summon-panel mt-6 p-6"><h2 className="text-sm font-semibold">Forecasting, monitoring, dan hasil akhir</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Forecasting dipakai saat menyiapkan jadwal; data prakiraan ditampilkan pada peta lokasi. Monitoring menampilkan bacaan WBGT tersimpan dan progres tindakan pada shift yang dibuka. Siklus berakhir setelah HSE memverifikasi seluruh tindakan dan menutup shift; hasilnya ada di Laporan & evaluasi.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="panel-link" href="/forecasting">Peta forecasting</Link><Link className="panel-link" href="/monitoring">Monitoring shift</Link><Link className="panel-link" href="/absensi">Absensi pekerja</Link></div></section>
    <section className="summon-panel mt-6 p-6"><h2 className="text-sm font-semibold">Peran perangkat IoT</h2><p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">Station menyediakan WBGT untuk rencana kerja. Water Station dan Band dapat dipantau melalui Perangkat IoT. Penyimpanan bacaan untuk perencanaan dilakukan dari tugas Sensor pada shift yang dibuka.</p></section>
  </>
}

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
  ["Peserta", "HSE memeriksa penugasan dan mengonfirmasi adaptasi satu pekerja pada satu waktu."],
  ["Sensor", "Periksa WBGT dari Station. Simpan bacaannya ke shift, lalu lanjutkan."],
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
    <PageHeader title="Cara menjalankan satu shift" summary="Mulai dari data pekerja dan satu draft shift. Selanjutnya kerjakan enam tugas dalam halaman shift yang sama." />
    <section className="summon-panel mb-6 p-6"><h2 className="text-lg font-semibold">Satu tugas pada satu waktu.</h2><p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">Isi formulir pada tugas yang terbuka. Setelah lengkap, gunakan tombol Lanjut. Saat giliran peran lain, buka tugas penanggung jawab yang disebutkan. Anda tetap berada di shift yang sama.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href={shift ? `/shift/${shift.id}` : "/ringkasan"}>{shift ? "Lanjutkan shift" : "Mulai dari shift kerja"}<ArrowRightIcon /></Link></Button><GuideButton mode="journey" label="Tunjukkan alurnya" /></div></section>
    <section className="summon-panel p-6"><h2 className="mb-4 text-sm font-semibold">Urutan kerja</h2><ol className="flow-step-list">{tasks.map(([title,description],index) => <li key={title}><div><strong>{title}</strong><p>{description}</p>{flow && <p className="text-xs text-muted-foreground">{flow.steps[index].done ? "Selesai" : flow.steps[index].progress}</p>}</div></li>)}</ol></section>
    <section className="summon-panel mt-6 p-6"><h2 className="text-sm font-semibold">Peran perangkat IoT</h2><p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">Station menyediakan WBGT untuk rencana kerja. Water Station dan Band dapat dipantau melalui Perangkat IoT. Penyimpanan bacaan untuk perencanaan dilakukan dari tugas Sensor pada shift yang dibuka.</p></section>
  </>
}

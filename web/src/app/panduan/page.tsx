"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LABEL_PERAN } from "@/lib/access"
import { USERS } from "@/lib/config"
import { useApp } from "@/lib/store"
import { workflow } from "@/lib/workflow"
import { STEP_OUTCOMES } from "@/lib/workspace"

export default function PanduanPage() {
  const { state, user, dispatch } = useApp()
  if (!user) return null
  const steps = workflow(state, user)
  return <>
    <PageHeader title="Kenali ruang kerja TERMA" summary="Dari data pekerja sampai tindak lanjut: coba alur pengelolaan paparan panas dalam satu ruang demo." />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Panduan alur kerja" className="rounded-xl border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold">Satu shift, tujuh langkah</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Setiap tahap menghasilkan masukan untuk tahap berikutnya. Halaman tetap dapat dibuka kapan saja; aksi mengikuti peran aktif.</p>
        <ol className="mt-5 divide-y">{steps.map(step => <li key={step.href}><Link href={step.href} className="flex items-start gap-4 rounded-md py-5 hover:bg-muted"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-sm">{step.no}</span><span className="flex-1"><span className="block font-medium">{step.label}</span><span className="mt-1 block text-sm text-muted-foreground">{STEP_OUTCOMES[step.href]}</span><span className="mt-2 block text-xs text-muted-foreground">{step.peran.map(p => LABEL_PERAN[p]).join(" · ")}</span></span><ArrowRight className="mt-1 size-4 shrink-0" aria-hidden /></Link></li>)}</ol>
      </section>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Coba sebagai peran lain</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm leading-relaxed text-muted-foreground">Pemilih ini mensimulasikan peran, bukan login sungguhan. HSE menyetujui dan memverifikasi; mandor mengakui instruksi dan melaporkan pelaksanaan.</p><div className="divide-y">{USERS.map(u => <div key={u.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{u.nama}</p><p className="text-xs text-muted-foreground">{LABEL_PERAN[u.role]}{u.reguKode ? ` · ${u.reguKode}` : " · semua regu"}</p></div><Button variant={user.id === u.id ? "secondary" : "outline"} onClick={() => dispatch({ type: "LOGIN", userId: u.id })} aria-label={`Coba peran ${u.nama}`} aria-pressed={user.id === u.id}>{user.id === u.id ? <><CheckCircle2 aria-hidden />Aktif</> : "Coba peran"}</Button></div>)}</div></CardContent></Card>
        <section className="rounded-lg bg-secondary p-6"><h2 className="font-heading text-lg font-semibold">Yang disimulasikan</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed"><li>8 pekerja fiktif, 2 regu, 3 zona, dan bacaan panas replay pada tanggal awal demo.</li><li>Persetujuan, pembagian instruksi, dan laporan tindakan tersimpan lokal di browser ini.</li><li>Tidak ada pesan yang dikirim oleh aplikasi dan tidak ada sinkronisasi antarpengguna.</li><li>Data lama tetap terpisah. Jangan memasukkan identitas atau catatan operasional nyata.</li></ul></section>
        <section><h2 className="font-heading text-lg font-semibold">Istilah yang perlu diketahui</h2><Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="wbgt"><AccordionTrigger>Apa itu WBGT / ISBB?</AccordionTrigger><AccordionContent>Indeks yang dipakai dalam rencana paparan panas. Di demo ini, bacaan diberi label REPLAY. Prakiraan cuaca tidak diperlakukan sebagai pengukuran WBGT lokasi.</AccordionContent></AccordionItem>
          <AccordionItem value="status"><AccordionTrigger>Mengapa status dan kualitas data terpisah?</AccordionTrigger><AccordionContent>Status menjelaskan tindakan yang perlu dilakukan. Kualitas menjelaskan sumber data yang mendasarinya. Status rencana bukan pernyataan pekerja sehat atau bebas risiko.</AccordionContent></AccordionItem>
          <AccordionItem value="duration"><AccordionTrigger>Direncanakan, dilaporkan, atau diverifikasi?</AccordionTrigger><AccordionContent>Direncanakan berasal dari rencana kerja. Dilaporkan diisi mandor setelah pelaksanaan. Diverifikasi adalah durasi yang diperiksa HSE. Ketiganya tidak saling menggantikan.</AccordionContent></AccordionItem>
          <AccordionItem value="rules"><AccordionTrigger>Apakah ini siap untuk operasi nyata?</AccordionTrigger><AccordionContent>Belum. Ini prototipe interaktif dengan data mock, penyimpanan lokal, dan tabel NAB fixture yang belum disahkan HSE. Autentikasi, backend, integrasi pesan, serta validasi aturan operasional belum tersedia.</AccordionContent></AccordionItem>
        </Accordion></section>
        <Button asChild><Link href="/">Kembali ke ringkasan<ArrowRight aria-hidden /></Link></Button>
      </div>
    </div>
  </>
}

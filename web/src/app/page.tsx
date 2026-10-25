"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ArrowUpRight, ClipboardCheck, UsersRound } from "lucide-react"
import { DemoSeed } from "@/components/demo-seed"
import { ShiftContext } from "@/components/shift-context"
import { ExposureChart, ZoneOverview } from "@/components/zone-overview"
import { LifecycleBadge, QualityBadge, StatusChip } from "@/components/status"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { lingkupPekerja } from "@/lib/access"
import { JAM_SHIFT } from "@/lib/config"
import { overviewZones } from "@/lib/overview"
import { jam } from "@/lib/rules"
import { kandidatUntuk, rencanaAktif, useApp } from "@/lib/store"
import { nextWorkflowStep } from "@/lib/workflow"

export default function Home() {
  const { state, user } = useApp()
  const [zoneCode, setZoneCode] = useState("COR_B")
  const [hour, setHour] = useState(JAM_SHIFT[0])
  if (!user) return null
  const pekerja = lingkupPekerja(user, state.pekerja)
  const terlihat = new Set(pekerja.map((p) => p.kode))
  const aktif = rencanaAktif(state).filter((r) => terlihat.has(r.pekerjaKode))
  const perluTinjau = aktif.filter((r) => r.status === "TINJAU_HSE" || !r.disetujuiOleh)
  const perluAdaptasi = pekerja.filter((p) => kandidatUntuk(state, p).pemicu)
  const ids = new Set(aktif.map((r) => r.id))
  const tindakan = state.tindakan.filter((t) => ids.has(t.rencanaId) && !["TERVERIFIKASI", "BELUM_SELESAI"].includes(t.status))
  const zones = overviewZones(state, user, hour)
  const selected = zones.find((z) => z.kode === zoneCode) ?? zones[0]
  const next = nextWorkflowStep(state, user)
  const nama = (kode: string) => pekerja.find((p) => p.kode === kode)?.nama ?? kode
  const valid = zones.reduce((total, z) => total + z.valid, 0)

  return <>
    <div className="overview-heading">
      <div><h1>Lokasi 1<span className="text-muted-foreground"> / Ringkasan</span></h1><p className="mt-3 text-sm text-muted-foreground">Pemantauan paparan panas & tindak lanjut kerja</p></div>
      <dl className="overview-stats">
        <div><dd>{pekerja.length}</dd><dt>Pekerja dalam lingkup</dt></div>
        <div><dd>{valid}<span className="text-lg text-muted-foreground"> / {zones.length * JAM_SHIFT.length}</span></dd><dt>Interval bersumber valid</dt></div>
        <div><dd>{perluTinjau.length}</dd><dt>Rencana perlu ditinjau</dt></div>
      </dl>
    </div>
    {state.pekerja.length === 0 && <DemoSeed />}
    <ShiftContext />
    <ZoneOverview zones={zones} selected={selected} onZone={setZoneCode} hour={hour} onHour={setHour} />
    <div className="dashboard-lower">
      <Card>
        <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>Profil panas harian</CardTitle><CardDescription className="mt-2">{selected.nama} · {state.tanggal}</CardDescription></div><QualityBadge kualitas={selected.kualitas} /></div></CardHeader>
        <CardContent>
          {selected.series.some((p) => p.reading) && <p className="mb-3 text-xs text-muted-foreground md:hidden">Geser grafik ke samping untuk melihat semua jam, 08.00–15.00.</p>}
          <div className="chart-scroll" tabIndex={0} role="region" aria-label="Grafik WBGT per jam, dapat digulir"><ExposureChart zone={selected} hour={hour} /></div>
          <Accordion type="single" collapsible className="mt-3 border-t"><AccordionItem value="bacaan"><AccordionTrigger>Lihat nilai & sumber per jam</AccordionTrigger><AccordionContent><Table><TableHeader><TableRow><TableHead>Jam</TableHead><TableHead>ISBB</TableHead><TableHead>Kualitas</TableHead></TableRow></TableHeader><TableBody>{selected.series.map((p) => <TableRow key={p.hour}><TableCell>{jam(p.hour)}</TableCell><TableCell>{p.reading ? p.reading.isbb.toFixed(1).replace(".", ",") + " °C" : "—"}</TableCell><TableCell><QualityBadge kualitas={p.kualitas} /></TableCell></TableRow>)}</TableBody></Table></AccordionContent></AccordionItem></Accordion>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>Perlu perhatian HSE</CardTitle><CardDescription className="mt-2">Belum disetujui atau berstatus TINJAU HSE.</CardDescription></div><Button asChild variant="ghost" size="icon"><Link href="/rencana" aria-label="Lihat seluruh rencana"><ArrowUpRight /></Link></Button></div></CardHeader>
        <CardContent>
          {perluTinjau.length === 0 && <p className="py-6 text-sm text-muted-foreground">{state.rencanaDihitung ? "Tidak ada rencana yang menunggu tinjauan." : "Rencana belum dihitung. Lengkapi data dan buka halaman Rencana."}</p>}
          {perluTinjau.map((r) => <Link href="/rencana" key={r.id} className="review-row hover:text-primary"><span><span className="block text-sm font-medium">{nama(r.pekerjaKode)}</span><span className="mt-1 block text-xs text-muted-foreground">{r.id.split("@")[0]}</span></span><span className="flex flex-wrap gap-2"><StatusChip status={r.status} /><QualityBadge kualitas={r.kualitas} /></span></Link>)}
        </CardContent>
      </Card>
    </div>
    <section className="next-task" aria-label="Langkah berikutnya">
      <div><h2 className="font-heading text-lg font-semibold">{state.pekerja.length === 0 ? user.role === "MANDOR" ? "Menunggu rencana dari HSE" : "Siapkan rencana kerja pertama" : "Berikutnya: " + next.label}</h2><p className="mt-2 max-w-prose text-sm text-muted-foreground">{next.progress}. Status tindakan bukan status kesehatan.</p></div>
      <Button asChild><Link href={next.href}>{state.pekerja.length === 0 && user.role !== "MANDOR" ? "Impor data pekerja" : "Buka " + next.label.toLowerCase()}<ArrowRight aria-hidden /></Link></Button>
    </section>
    <div className="dashboard-lower">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="size-4 text-muted-foreground" aria-hidden />Adaptasi & konfirmasi</CardTitle><CardDescription>{perluAdaptasi.length} pekerja perlu adaptasi atau konfirmasi riwayat.</CardDescription></CardHeader>
        <CardContent>{perluAdaptasi.length === 0 && <p className="text-sm text-muted-foreground">{pekerja.length ? "Tidak ada kandidat adaptasi." : "Kandidat muncul setelah data pekerja dan kehadiran tersedia."}</p>}{perluAdaptasi.map((p) => {
          const k = state.konfirmasi.find((x) => x.pekerjaKode === p.kode)
          return <Link key={p.kode} href="/paparan" className="review-row text-sm hover:text-primary"><span>{p.nama}</span><span className="text-xs text-muted-foreground">{k ? "Dikonfirmasi · hari ke-" + k.hariAdaptasi : "Belum dikonfirmasi"}</span></Link>
        })}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-4 text-muted-foreground" aria-hidden />Tindakan terbuka</CardTitle><CardDescription>{tindakan.length} tindakan belum terverifikasi HSE.</CardDescription></CardHeader>
        <CardContent>{tindakan.length === 0 && <p className="text-sm text-muted-foreground">Belum ada tindakan terbuka untuk tanggal ini.</p>}{tindakan.slice(0, 4).map((t) => <Link key={t.id} href="/tindakan" className="review-row text-sm hover:text-primary"><span className="max-w-prose leading-relaxed">{t.deskripsi}</span><LifecycleBadge status={t.status} /></Link>)}{tindakan.length > 4 && <Button asChild variant="ghost"><Link href="/tindakan">Lihat {tindakan.length - 4} tindakan lainnya<ArrowRight aria-hidden /></Link></Button>}</CardContent>
      </Card>
    </div>
  </>
}

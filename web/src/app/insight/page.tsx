"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PulseIcon as Activity, ArrowRightIcon as ArrowRight, ArrowsLeftRightIcon as ArrowRightLeft, ClipboardTextIcon as ClipboardCheck, InfoIcon as Info, ShieldWarningIcon as ShieldAlert } from "@phosphor-icons/react"
import { PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { OriginBadge, QualityBadge, StatusChip } from "@/components/status"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { lingkupPekerja } from "@/lib/access"
import { ATURAN_FIXTURE, REGU, TUGAS, ZONA } from "@/lib/config"
import { individualInsight, simulateZone, type InsightLevel } from "@/lib/individual-insight"
import { rentangJam } from "@/lib/rules"
import { rencanaAktif, useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

const LEVEL_LABEL: Record<InsightLevel, string> = {
  BELUM_ADA: "Belum ada data",
  DATA_KURANG: "Perlu verifikasi",
  BATASI: "Perlu pembatasan",
  ADAPTASI: "Perlu pemantauan",
  PANTAU: "Pantau terjadwal",
}

export default function InsightPage() {
  const { state, user } = useApp()
  const [selectedCode, setSelectedCode] = useState("")
  const [comparisonZone, setComparisonZone] = useState("")
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("pekerja")
    if (code) setSelectedCode(code)
  }, [])
  if (!user) return null
  const workers = lingkupPekerja(user, state.pekerja)
  const worker = workers.find(item => item.kode === selectedCode) ?? workers[0]
  const assignment = state.penugasan.find(item => item.pekerjaKode === worker?.kode)
  const plan = rencanaAktif(state).find(item => item.pekerjaKode === worker?.kode)
  const insight = individualInsight(plan)
  const task = TUGAS.find(item => item.kode === assignment?.tugasKode)
  const crew = REGU.find(item => item.kode === worker?.reguKode)
  const zone = ZONA.find(item => item.kode === assignment?.zonaKode)
  const alternative = ZONA.find(item => item.kode === comparisonZone && item.kode !== assignment?.zonaKode)
  const scenario = alternative && worker ? simulateZone(state, worker, alternative.kode) : null
  const focusInterval = insight.intervals.find(item => item.barisNab === null)
    ?? (plan?.status === "ADAPTASI_DIPERLUKAN" ? insight.intervals[0] : undefined)
  const focusMessage = focusInterval
    ? focusInterval.kualitas === "TERUKUR" || focusInterval.kualitas === "REPLAY"
      ? focusInterval.barisNab === null ? "Tidak ada alokasi kerja pada aturan yang dipakai." : "Mulai shift dengan pengawasan adaptasi pekerja."
      : "Bacaan WBGT belum valid; perlu pengukuran langsung."
    : plan?.status === "TINJAU_HSE" ? "Rencana tetap memerlukan tinjauan HSE. Periksa APD, riwayat, dan alasan rencana sebelum paparan panas."
      : plan?.status === "BATASI_ATAU_PINDAHKAN" ? "Rencana memerlukan pembatasan paparan. Tinjau alasan dan pilihan penugasan bersama HSE."
        : plan ? "Tidak ada interval yang terblokir pada rencana ini. Tetap pantau kondisi pekerja." : "Hitung rencana untuk melihat jendela perhatian."

  return <>
    <PageHeader title="Insight individu" summary="Tinjau paparan, adaptasi, dan celah data per pekerja berdasarkan rencana serta aturan yang aktif." />
    {!workers.length ? <WorkflowEmpty title="Belum ada pekerja dalam lingkup Anda" href="/impor" label="Buka data pekerja">Tambahkan pekerja dan penugasan sebelum membuka insight individu.</WorkflowEmpty> : <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-sm space-y-2">
          <Label htmlFor="insight-worker">Pilih pekerja</Label>
          <Select value={worker.kode} onValueChange={value => { setSelectedCode(value); setComparisonZone(""); window.history.replaceState(window.history.state, "", `/insight?pekerja=${encodeURIComponent(value)}`) }}>
            <SelectTrigger id="insight-worker" className="w-full bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>{workers.map(item => <SelectItem key={item.kode} value={item.kode}>{item.nama} · {item.kode}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button asChild variant="outline"><Link href={`/pekerja/${worker.kode}`}>Buka profil pekerja<ArrowRight aria-hidden /></Link></Button>
      </div>

      <div key={`${worker.kode}-${plan?.id ?? "none"}`} className="insight-content">
        <section className="insight-feature" aria-labelledby="insight-headline">
          <div className="insight-feature-main">
            <h2 id="insight-headline" className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{insight.headline}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{insight.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2"><span className="insight-feature-status">{LEVEL_LABEL[insight.level]}</span><span className="text-xs text-white">{worker.nama} · {crew?.nama ?? worker.reguKode} · {task?.nama ?? "Belum ditugaskan"}</span></div>
          </div>
          <div className="insight-feature-side"><p className="text-xs font-semibold uppercase tracking-wide text-white">Jendela perhatian</p><p className="mt-2 text-2xl font-semibold tabular-nums">{focusInterval ? rentangJam(focusInterval.jamMulai) : plan ? "Sepanjang shift" : "Belum tersedia"}</p><p className="mt-3 text-sm leading-relaxed text-white">{focusMessage}</p><div className="mt-5 border-t border-white/25 pt-4 text-xs leading-relaxed text-white">Analisis berbasis aturan · {tanggalLabel(state.tanggal)}<br />{zone?.nama ?? "Zona belum dipilih"} · rencana {plan ? `v${plan.version}` : "belum ada"}<br />Indikator paparan untuk tinjauan HSE.</div></div>
        </section>

        <div className="insight-metrics" aria-label="Ringkasan sumber paparan">
          <Metric label="Cakupan bacaan" value={plan ? `${insight.validIntervals}/${plan.intervals.length}` : "—"} note="interval WBGT valid" />
          <Metric label="Puncak ISBB tercatat" value={insight.peakIsbb === null ? "—" : `${insight.peakIsbb.toFixed(1).replace(".", ",")}°C`} note="bukan suhu tubuh · dapat berupa replay" />
          <Metric label="Paparan direncanakan" value={plan ? `${insight.plannedMinutes} mnt` : "—"} note="bukan durasi terverifikasi" />
          <Metric label="Perlu pengukuran" value={plan ? `${insight.missingIntervals}` : "—"} note="interval tanpa bacaan valid" />
        </div>

        <section className="mt-6 border-y py-5" aria-labelledby="insight-factors-title"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 id="insight-factors-title" className="text-base font-semibold">Sinyal pembentuk insight</h3><p className="text-xs text-muted-foreground">Dibaca dari data pekerja dan rencana yang aktif, tanpa input kesehatan pribadi.</p></div><dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Factor label="Beban tugas" value={task ? sentenceCase(task.beban.replaceAll("_", " ")) : "Belum ada"} detail={task?.nama ?? "Tugas belum dicatat"} /><Factor label="Alokasi adaptasi" value={plan ? `${plan.persenAdaptasi}% dari batas harian` : "Belum tersedia"} detail={plan && plan.persenAdaptasi < 100 ? "Perlu konfirmasi dan pengawasan HSE" : "Ikuti status pada rencana aktif"} /><Factor label="Perlengkapan kerja" value={assignment?.apd ?? "Belum dicatat"} detail={assignment && !ATURAN_FIXTURE.apdDidukung.includes(assignment.apd) ? "Belum didukung aturan fixture" : "Dibaca dari penugasan"} /><Factor label="Mutu sumber" value={plan ? sentenceCase(plan.kualitas.replaceAll("_", " ")) : "Belum tersedia"} detail={"Periksa asal dan waktu bacaan"} /></dl></section>

        {plan && assignment && <Card className="mt-6 bg-secondary/40"><CardHeader className="gap-2"><div className="flex items-center gap-2"><ArrowRightLeft className="size-5 text-primary" aria-hidden /><CardTitle>Perbandingan zona</CardTitle></div><p className="max-w-3xl text-sm text-muted-foreground">Bandingkan rencana saat ini dengan zona lain berdasarkan bacaan yang tersedia. Perbandingan ini tidak mengubah rencana, persetujuan, atau penugasan pekerja.</p></CardHeader><CardContent>
          <div className="grid items-end gap-4 lg:grid-cols-[minmax(240px,330px)_1fr]"><div className="space-y-2"><Label htmlFor="insight-zone">Zona pembanding</Label><Select value={alternative?.kode ?? ""} onValueChange={setComparisonZone}><SelectTrigger id="insight-zone" className="w-full bg-card"><SelectValue placeholder="Pilih zona untuk dibandingkan" /></SelectTrigger><SelectContent>{ZONA.filter(item => item.kode !== assignment.zonaKode).map(item => <SelectItem key={item.kode} value={item.kode}>{item.nama}</SelectItem>)}</SelectContent></Select></div><p className="max-w-prose text-xs leading-relaxed text-muted-foreground">Hasil dihitung ulang dari data saat ini dengan aturan {ATURAN_FIXTURE.versi}. Zona tanpa bacaan tidak dianggap lebih baik.</p></div>
          {scenario && alternative && <div className="mt-5 border-t pt-5"><div className="mb-4 flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">{zone?.nama}</span><ArrowRight className="size-4 text-muted-foreground" aria-hidden /><span className="font-semibold">{alternative.nama}</span><span className="ml-auto inline-flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Hasil perbandingan</span><StatusChip status={scenario.status} /></span></div><div className="insight-comparison-grid"><Compare label="Interval tanpa alokasi" before={insight.blockedIntervals} after={scenario.blockedIntervals} unit="jam" /><Compare label="Interval tanpa WBGT valid" before={insight.missingIntervals} after={scenario.missingIntervals} unit="jam" /><Compare label="Paparan direncanakan" before={insight.plannedMinutes} after={scenario.plannedMinutes} unit="mnt" /></div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Perbedaan menit kerja adalah hasil perhitungan rencana, bukan prediksi kesehatan atau izin memindahkan pekerja. HSE harus meninjau APD, tugas, lokasi, dan bacaan nyata sebelum menyetujui perubahan.</p></div>}
        </CardContent></Card>}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
          <Card><CardHeader className="gap-2"><div className="flex items-center gap-2"><Activity className="size-5 text-primary" aria-hidden /><CardTitle>Pola paparan sepanjang shift</CardTitle></div><p className="text-sm text-muted-foreground">Tinggi batang menunjukkan menit kerja yang <strong>direncanakan</strong> per jam. Angka ISBB berasal dari bacaan zona; celah data tetap kosong.</p></CardHeader><CardContent>
            {plan ? <><div className="overflow-x-auto pb-2" tabIndex={0} aria-label="Grafik interval, geser horizontal untuk semua jam"><div className="insight-timeline">
              {insight.intervals.map(interval => <div key={interval.jamMulai} className="insight-interval">
                <div className="insight-interval-top"><span>{interval.isbb === null ? "—" : `${interval.isbb.toFixed(1).replace(".", ",")}°`}</span><span className="text-[11px] text-muted-foreground">{interval.kerjaDirencanakan} mnt</span></div>
                <div className={`insight-bar-track ${interval.barisNab === null ? "insight-bar-uncertain" : ""}`} role="img" aria-label={`${rentangJam(interval.jamMulai)}: ${interval.kerjaDirencanakan} menit kerja direncanakan; kualitas ${interval.kualitas.replaceAll("_", " ")}`}><span style={{ height: `${interval.kerjaDirencanakan / 60 * 100}%` }} /></div>
                <p className="mt-2 text-center text-xs font-medium tabular-nums">{String(interval.jamMulai).padStart(2, "0")}.00</p>
                <p className="mt-1 text-center text-[11px] leading-tight text-muted-foreground">{interval.barisNab === null ? "Tinjau" : "Rencana"}</p>
              </div>)}
            </div></div><p className="mt-3 text-xs text-muted-foreground">Bacaan {insight.validIntervals} interval · {insight.missingIntervals} belum valid · {insight.blockedIntervals} tanpa alokasi menurut aturan fixture.</p></> : <p className="text-sm text-muted-foreground">Grafik tersedia setelah rencana dihitung.</p>}
          </CardContent></Card>
          <Card><CardHeader className="gap-2"><div className="flex items-center gap-2"><ShieldAlert className="size-5 text-primary" aria-hidden /><CardTitle>Yang perlu dilihat HSE</CardTitle></div><p className="text-sm text-muted-foreground">Urutan tindakan berdasarkan celah data dan rencana yang ada.</p></CardHeader><CardContent><ol className="space-y-0 divide-y">{insight.actions.map((action, index) => <li key={`${index}-${action}`} className="flex gap-3 py-3 first:pt-0 last:pb-0"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">{index + 1}</span><span className="text-sm leading-relaxed">{action}</span></li>)}</ol></CardContent></Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
          <Card><CardHeader><CardTitle>Alasan yang dapat ditelusuri</CardTitle></CardHeader><CardContent>{plan ? <><div className="mb-4 flex flex-wrap items-center gap-2"><StatusChip status={plan.status} /><QualityBadge kualitas={plan.kualitas} /><OriginBadge origin={worker.origin} /></div><ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">{insight.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></> : <p className="text-sm text-muted-foreground">Belum ada alasan dari rencana pada tanggal ini.</p>}</CardContent></Card>
          <Card><CardHeader><div className="flex items-center gap-2"><Info className="size-5 text-primary" aria-hidden /><CardTitle>Batas kepercayaan</CardTitle></div></CardHeader><CardContent className="space-y-4 text-sm leading-relaxed"><p>Periksa asal dan waktu bacaan sebelum menindaklanjuti hasil analisis. Tabel aturan <strong>{ATURAN_FIXTURE.versi}</strong> belum disahkan sebagai acuan operasional.</p><p>Belum tersedia data gejala, kondisi medis, atau hasil kejadian untuk melatih dan menguji prediksi kesehatan individual. Karena itu TERMA tidak menampilkan peluang sakit atau label “sehat”.</p><p className="text-muted-foreground">Untuk penggunaan lapangan, validasi aturan oleh HSE, data nyata yang sah, autentikasi, dan evaluasi model harus selesai lebih dulu.</p></CardContent></Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-sm"><p className="max-w-2xl text-muted-foreground">Jika pekerja melaporkan keluhan terkait panas, lakukan pemeriksaan langsung dan ikuti prosedur tanggap darurat lokasi. Insight ini tidak menunda respons.</p><Button asChild variant="outline"><Link href="/rencana"><ClipboardCheck aria-hidden />Tinjau rencana<ArrowRight aria-hidden /></Link></Button></div>
      </div>
    </>}
  </>
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="insight-metric"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>
}

function Compare({ label, before, after, unit }: { label: string; before: number; after: number; unit: string }) {
  return <div className="insight-comparison-item"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="mt-3 flex items-baseline gap-2 tabular-nums"><span className="text-sm text-muted-foreground">{before}</span><ArrowRight className="size-4 text-muted-foreground" aria-hidden /><strong className="text-xl">{after}</strong><span className="text-xs text-muted-foreground">{unit}</span></div></div>
}

function Factor({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>
}

function sentenceCase(value: string) { return value.charAt(0) + value.slice(1).toLocaleLowerCase("id-ID") }

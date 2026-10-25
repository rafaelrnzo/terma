"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { LifecycleBadge, OriginBadge } from "@/components/status"
import { RencanaCard } from "@/components/rencana-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { lingkupPekerja } from "@/lib/access"
import { REGU, TUGAS, USERS, ZONA } from "@/lib/config"
import { kandidatUntuk, rencanaAktif, useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

export default function PekerjaPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params)
  const { state, user } = useApp()
  if (!user) return null
  const worker = lingkupPekerja(user, state.pekerja).find(p => p.kode === kode)
  if (!worker) return <><PageHeader title="Profil tidak tersedia" /><WorkflowEmpty title="Pekerja tidak ditemukan dalam lingkup Anda" href="/impor" label="Kembali ke direktori">Periksa ID pekerja atau gunakan peran yang berwenang. Identitas pekerja di luar regu Anda tidak ditampilkan.</WorkflowEmpty></>
  const assignment = state.penugasan.find(a => a.pekerjaKode === kode)
  const crew = REGU.find(g => g.kode === worker.reguKode)
  const confirmation = state.konfirmasi.find(k => k.pekerjaKode === kode)
  const candidate = kandidatUntuk(state, worker)
  const plan = rencanaAktif(state).find(r => r.pekerjaKode === kode)
  const actions = state.tindakan.filter(t => t.rencanaId === plan?.id)
  const attendance = state.kehadiran.filter(k => k.pekerjaKode === kode && k.tanggal <= state.tanggal).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 14)
  return <>
    <Button className="mb-5" variant="ghost" asChild><Link href="/impor"><ArrowLeft aria-hidden />Direktori pekerja</Link></Button>
    <PageHeader title={worker.nama} summary={`${worker.kode} · ${crew?.nama} · Bergabung ${tanggalLabel(worker.tanggalMulai)}`} />
    <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card><CardHeader><CardTitle>Penugasan & penanggung jawab</CardTitle></CardHeader><CardContent><dl className="grid grid-cols-2 gap-x-5 gap-y-5 text-sm">
        <Field label="Tugas" value={TUGAS.find(t => t.kode === assignment?.tugasKode)?.nama ?? "Belum ada"} />
        <Field label="Zona kerja" value={ZONA.find(z => z.kode === assignment?.zonaKode)?.nama ?? "Belum ada"} />
        <Field label="Mandor" value={USERS.find(u => u.id === crew?.mandorId)?.nama ?? "Belum ditetapkan"} />
        <Field label="APD" value={assignment?.apd ?? "Belum dicatat"} />
      </dl><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><OriginBadge origin={worker.origin} /><Button asChild variant="outline"><Link href={`/regu/${worker.reguKode.toLowerCase()}`}>Lihat regu<ArrowRight aria-hidden /></Link></Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Riwayat adaptasi</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{candidate.keterangan}</p><p className="text-muted-foreground">{confirmation ? `Dikonfirmasi ${confirmation.dikonfirmasiOleh} · ${confirmation.profil === "NORMAL" ? "Profil normal" : "Adaptasi hari ke-" + confirmation.hariAdaptasi}` : "Belum ada konfirmasi riwayat oleh HSE."}</p><p>{attendance.filter(a => a.status === "HADIR").length} hadir dari {attendance.length} catatan terakhir.</p><p className="text-xs text-muted-foreground">Kehadiran bukan bukti durasi paparan panas.</p><Button asChild variant="outline"><Link href="/paparan">Tinjau adaptasi<ArrowRight aria-hidden /></Link></Button></CardContent></Card>
    </div>
    <section aria-label="Rencana pekerja"><h2 className="mb-4 font-heading text-xl font-semibold">Rencana pada {tanggalLabel(state.tanggal)}</h2>{plan ? <RencanaCard r={plan} mode={user.role === "MANDOR" ? "mandor" : "hse"} /> : <WorkflowEmpty title="Belum ada rencana pada tanggal ini" href="/rencana" label="Buka rencana kerja">Periksa tanggal aktif dan kelengkapan data sebelum menghitung rencana.</WorkflowEmpty>}</section>
    <Card className="mt-6"><CardHeader><CardTitle>Tindak lanjut pekerja</CardTitle></CardHeader><CardContent className="space-y-4">{actions.length ? actions.map(t => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="max-w-prose">{t.deskripsi}</p><LifecycleBadge status={t.status} /></div>) : <p className="text-sm text-muted-foreground">Tindakan dibuat setelah rencana disetujui dan instruksi dibagikan.</p>}<Button asChild variant="outline"><Link href="/tindakan">Buka tindakan & verifikasi<ArrowRight aria-hidden /></Link></Button></CardContent></Card>
  </>
}

function Field({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div> }

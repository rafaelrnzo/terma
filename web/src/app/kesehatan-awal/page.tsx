"use client"

import { OptionSelect } from "@/components/ui/option-select"
import { Suspense, useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HEALTH_STATUS_LABEL } from "@/components/shift-health-review"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import type { WorkHealthStatus, BaselineInput } from "@/lib/worker-readiness"

const statuses: WorkHealthStatus[] = ["TANPA_PEMBATASAN", "DENGAN_PEMBATASAN", "PERLU_TINJAU"]

function BaselineForm({ workerCode }: { workerCode: string }) {
  const { state, dispatch } = useApp()
  const existing = managementOf(state).healthBaselines?.find(row => row.pekerjaKode === workerCode)
  const [date, setDate] = useState(existing?.tanggalPemeriksaan ?? "")
  const [expiry, setExpiry] = useState(existing?.berlakuSampai ?? "")
  const [status, setStatus] = useState<WorkHealthStatus>(existing?.status ?? "PERLU_TINJAU")
  const [restriction, setRestriction] = useState(existing?.pembatasan ?? "")
  const [source, setSource] = useState(existing?.sumber ?? "")
  function save(event: FormEvent) {
    event.preventDefault()
    const input: BaselineInput = { pekerjaKode: workerCode, tanggalPemeriksaan: date, berlakuSampai: expiry, status, pembatasan: restriction, sumber: source }
    dispatch({ type: "SIMPAN_BASELINE", input })
  }
  return <form onSubmit={save} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="baseline-date">Tanggal pemeriksaan</Label><Input id="baseline-date" type="date" value={date} onChange={event => setDate(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="baseline-expiry">Berlaku sampai</Label><Input id="baseline-expiry" type="date" value={expiry} onChange={event => setExpiry(event.target.value)} required /></div></div><fieldset className="space-y-3"><legend className="mb-3 text-sm font-medium">Kesimpulan kerja pada dokumen perusahaan</legend>{statuses.map(value => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="baseline-status" checked={status === value} onChange={() => setStatus(value)} />{HEALTH_STATUS_LABEL[value]}</label>)}</fieldset><div className="space-y-2"><Label htmlFor="baseline-restriction">Pembatasan kerja / tindak lanjut dari dokumen</Label><Input id="baseline-restriction" value={restriction} onChange={event => setRestriction(event.target.value)} maxLength={1000} required={status !== "TANPA_PEMBATASAN"} placeholder="Ringkasan arahan kerja dari pemeriksa, tanpa rincian diagnosis" /></div><div className="space-y-2"><Label htmlFor="baseline-source">Sumber / nomor dokumen</Label><Input id="baseline-source" value={source} onChange={event => setSource(event.target.value)} required minLength={3} maxLength={300} placeholder="Contoh: Ringkasan pemeriksaan perusahaan, nomor dokumen" /></div><Button type="submit">Simpan baseline perusahaan</Button></form>
}

function HealthBaselineContent() {
  const searchParams = useSearchParams()
  const { state, user } = useApp()
  const [selectedCode, setSelectedCode] = useState(searchParams.get("pekerja") ?? "")
  if (!user) return null
  if (user.role === "MANDOR") return <PageHeader title="Ringkasan kesehatan terbatas untuk HSE" summary="Gunakan halaman tugas regu untuk melihat status tindak lanjut tanpa rincian kondisi pekerja." />
  const management = managementOf(state)
  const workers = management.workers.filter(worker => !worker.diarsipkan)
  const worker = workers.find(row => row.kode === selectedCode) ?? workers[0]
  return <><PageHeader title="Baseline kesehatan perusahaan" summary="Gunakan ringkasan hasil pemeriksaan yang sudah dimiliki perusahaan sebagai konteks awal. Klinik menangani jawaban check-in secara privat; HSE menggunakan ringkasan pembatasan kerja untuk rencana." /><section className="summon-panel p-6"><h2 className="text-lg font-semibold">{user.role === "HSE" ? "Ringkasan pemeriksaan & pembatasan kerja" : "Kelengkapan dokumen perusahaan"}</h2><p className="my-4 max-w-prose text-sm leading-relaxed text-muted-foreground">Rincian diagnosis, obat, dan hasil laboratorium tetap berada di layanan klinik. Di sini dicatat kesimpulan kerja dan sumber dokumen. Setiap shift menyimpan salinan baseline; perubahan master tidak menulis ulang riwayat.</p>{!workers.length ? <p className="text-sm text-muted-foreground">Tambahkan data pekerja terlebih dahulu.</p> : user.role === "PETUGAS_DATA" ? <div className="divide-y">{workers.map(row => <div key={row.kode} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><strong>{row.nama} · {row.kode}</strong><span>{management.healthBaselines?.some(baseline => baseline.pekerjaKode === row.kode) ? "Ringkasan dokumen tercatat" : "Perlu dilengkapi HSE"}</span></div>)}</div> : worker && <><div className="mb-6 space-y-2"><Label htmlFor="baseline-worker">Pekerja</Label><OptionSelect id="baseline-worker" value={worker.kode} onValueChange={setSelectedCode} options={workers.map(row=>({value:row.kode,label:`${row.nama} · ${row.kode}`}))} searchPlaceholder="Cari nama atau ID pekerja…" /></div><BaselineForm key={worker.kode} workerCode={worker.kode} /></>}</section></>
}

export default function HealthBaselinePage() {
  return <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Membuka baseline perusahaan…</p>}><HealthBaselineContent /></Suspense>
}

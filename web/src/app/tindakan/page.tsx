"use client"

import { useState } from "react"
import { MagnifyingGlassIcon as Search } from "@phosphor-icons/react"
import { NextStep, PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { RoleHint } from "@/components/role-hint"
import { LifecycleBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { REGU } from "@/lib/config"
import { kelompokTindakan, cocokPencarianTindakan, FILTER_TINDAKAN } from "@/lib/tindak-lanjut"
import { useApp, useIzin } from "@/lib/store"
import type { Tindakan } from "@/lib/types"

export default function TindakanPage() {
  const { state, user } = useApp()
  const izin = useIzin()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("SEMUA")
  const idsTanggal = new Set(state.rencana.filter((r) => r.tanggal === state.tanggal).map((r) => r.id))
  const dibatalkan = new Set(state.rencana.filter((r) => r.digantikan).map((r) => r.id))
  const milikTanggal = state.tindakan.filter((t) => idsTanggal.has(t.rencanaId))
  const daftar = user?.role === "MANDOR" ? milikTanggal.filter((t) => t.reguKode === user.reguKode) : milikTanggal
  const kelompok = (t: Tindakan) => kelompokTindakan(t, dibatalkan.has(t.rencanaId))
  const nama = (t: Tindakan) => state.pekerja.find((p) => p.kode === t.pekerjaKode)?.nama ?? t.pekerjaKode
  const hasil = daftar.filter((t) => (filter === "SEMUA" || kelompok(t) === filter) && cocokPencarianTindakan(t, nama(t), query))
  const reset = () => { setQuery(""); setFilter("SEMUA") }

  return <>
    <PageHeader no="6" title="Tindakan & verifikasi" peran="Mandor mencatat · HSE memverifikasi" summary="Catat pelaksanaan di lapangan, lalu verifikasi bersama HSE. Durasi rencana dan laporan tetap terpisah.">
      Setiap tindakan punya status sendiri: DIBUAT, DISAMPAIKAN, DIAKUI, TINDAKAN DILAPORKAN, lalu TERVERIFIKASI atau BELUM SELESAI.
      Durasi paparan direncanakan, dilaporkan mandor, dan diverifikasi HSE disimpan terpisah. Laporan mandor tidak mengubah data rencana
      menjadi data aktual, dan mandor tidak bisa menurunkan batas keselamatan dengan menulis alasan.
    </PageHeader>
    <RoleHint peran={user?.role === "HSE" ? ["HSE"] : ["MANDOR"]} />

    {daftar.length === 0 ? <WorkflowEmpty title="Belum ada tindakan untuk shift ini" href="/rencana" label="Buka rencana & persetujuan">Tindakan dibuat saat HSE menyetujui rencana. Setelah instruksi diakui, mandor dapat mencatat pelaksanaannya.</WorkflowEmpty> : <>
      <section data-guide="execution" className="accent-summary mb-6 rounded-xl bg-[image:var(--panel-accent)] p-6" aria-label="Ringkasan tindak lanjut">
        <dl className="grid grid-cols-3 gap-4">
          {[["Seluruh tindakan", daftar.length], ["Perlu verifikasi", daftar.filter((t) => kelompok(t) === "VERIFIKASI").length], ["Terverifikasi", daftar.filter((t) => kelompok(t) === "TERVERIFIKASI").length]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 font-heading text-3xl font-medium tabular-nums">{value}</dd></div>)}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">Lingkup {user?.role === "MANDOR" ? REGU.find((g) => g.kode === user.reguKode)?.nama : "lokasi"} · {state.tanggal}. Verifikasi administratif bukan pengukuran fisiologis.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Tindak lanjut shift</CardTitle>
          <CardDescription>Rencana, laporan, dan hasil verifikasi dalam menit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="no-print mb-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="space-y-2"><Label htmlFor="cari-tindakan">Cari tindakan</Label><div className="relative"><Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden /><Input id="cari-tindakan" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nama pekerja, ID, atau tindakan" className="pl-9" /></div></div>
            <div className="space-y-2"><Label htmlFor="filter-tindakan">Status tindak lanjut</Label><Select value={filter} onValueChange={setFilter}><SelectTrigger id="filter-tindakan" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{FILTER_TINDAKAN.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <p role="status" className="mb-4 text-xs text-muted-foreground">{hasil.length} dari {daftar.length} tindakan ditampilkan{filter !== "SEMUA" || query.trim() ? " · hasil difilter" : ""}.</p>
          {hasil.length === 0 && <div className="space-y-3 border-t py-8"><h3 className="font-heading text-lg font-semibold">Tidak ada tindakan yang cocok</h3><p className="text-sm text-muted-foreground">Coba nama atau ID lain, atau tampilkan seluruh status.</p><Button variant="outline" onClick={reset}>Reset pencarian & filter</Button></div>}
          <div className="divide-y">
            {hasil.map((t) => <article key={t.id} className="py-6 first:pt-0 last:pb-0" aria-label={`Tindakan ${nama(t)}`}>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3"><h3 className="font-heading text-lg font-semibold">{nama(t)}</h3><LifecycleBadge status={t.status} /></div>
                  <p className="mb-3 text-xs text-muted-foreground">{REGU.find((g) => g.kode === t.reguKode)?.nama} · {t.id}</p>
                  <p className="max-w-prose text-sm leading-relaxed">{t.deskripsi}</p>
                  {dibatalkan.has(t.rencanaId) && <p className="mt-2 text-sm text-status-adaptasi">Rencana sudah diganti versi baru: tindakan ini dibatalkan karena perubahan rencana.</p>}
                  {["TINDAKAN_DILAPORKAN", "TERVERIFIKASI", "BELUM_SELESAI"].includes(t.status) && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t.dijalankan ? `Dijalankan oleh ${t.pelaksana} pukul ${t.waktuTindakan}` : `Tidak dijalankan: ${t.alasanTidakDijalankan}`}{t.pemeriksa && ` · diperiksa ${t.pemeriksa}`}</p>}
                </div>
                <div className="space-y-4">
                  <dl className="grid grid-cols-3 gap-2 rounded-md bg-background p-3">
                    {[["Dirancang", t.menitDirencanakan], ["Dilaporkan", t.menitDilaporkan], ["Diverifikasi", t.menitDiverifikasi]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1 font-heading font-medium tabular-nums ${value !== undefined ? "text-xl" : "text-sm"}`}>{value ?? "Belum tersedia"}<span className="ml-1 text-xs font-normal text-muted-foreground">{value !== undefined ? "mnt" : ""}</span></dd></div>)}
                  </dl>
                  <div className="no-print flex flex-wrap items-center gap-2 xl:justify-end">
                    {izin("LAPOR_TINDAKAN", t.reguKode) && ["DIAKUI", "TINDAKAN_DILAPORKAN"].includes(t.status) && !dibatalkan.has(t.rencanaId) && <LaporDialog t={t} />}
                    {izin("VERIFIKASI") && t.status === "TINDAKAN_DILAPORKAN" && !dibatalkan.has(t.rencanaId) && <VerifikasiDialog t={t} />}
                    {t.status === "DIBUAT" && !dibatalkan.has(t.rencanaId) && <span className="text-xs text-muted-foreground">Menunggu pesan</span>}
                    {t.status === "DISAMPAIKAN" && !dibatalkan.has(t.rencanaId) && <span className="text-xs text-muted-foreground">Menunggu pengakuan</span>}
                  </div>
                </div>
              </div>
            </article>)}
          </div>
        </CardContent>
      </Card>
    </>}
    <NextStep />
  </>
}

function LaporDialog({ t }: { t: Tindakan }) {
  const { dispatch, user } = useApp()
  const [open, setOpen] = useState(false)
  const [dijalankan, setDijalankan] = useState(t.dijalankan ?? true)
  const [pelaksana, setPelaksana] = useState(t.pelaksana ?? user?.nama ?? "")
  const [waktu, setWaktu] = useState(t.waktuTindakan ?? "08:05")
  const [menit, setMenit] = useState(String(t.menitDilaporkan ?? t.menitDirencanakan))
  const [alasan, setAlasan] = useState(t.alasanTidakDijalankan ?? "")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t.status === "TINDAKAN_DILAPORKAN" ? "Perbarui laporan" : "Catat tindakan"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat tindakan</DialogTitle>
          <DialogDescription>{t.deskripsi}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <fieldset className="flex gap-4 text-sm">
            <legend className="mb-1 text-sm font-medium">Apakah tindakan dijalankan?</legend>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-input px-3"><input type="radio" name="jalan" className="accent-primary" checked={dijalankan} onChange={() => setDijalankan(true)} /> Ya</label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-input px-3"><input type="radio" name="jalan" className="accent-primary" checked={!dijalankan} onChange={() => setDijalankan(false)} /> Tidak</label>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pl">Pelaksana</Label>
              <Input id="pl" value={pelaksana} onChange={(e) => setPelaksana(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wk">Waktu</Label>
              <Input id="wk" type="time" value={waktu} onChange={(e) => setWaktu(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mn">Menit paparan panas yang dilaporkan</Label>
            <Input id="mn" type="number" min={0} max={480} value={menit} onChange={(e) => setMenit(e.target.value)} />
            <p className="text-xs text-muted-foreground">Rencana: {t.menitDirencanakan} menit. Laporan tidak mengubah batas rencana.</p>
          </div>
          {!dijalankan && (
            <div className="space-y-1">
              <Label htmlFor="al">Alasan tidak dijalankan (wajib)</Label>
              <Textarea id="al" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="mis. tidak ada tenaga pengganti, tempat istirahat penuh" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              dispatch({ type: "LAPOR", tindakanId: t.id, dijalankan, pelaksana, waktu, menit: Math.max(0, Number(menit) || 0), alasan })
              if (dijalankan || alasan.trim()) setOpen(false)
            }}
          >
            Simpan laporan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VerifikasiDialog({ t }: { t: Tindakan }) {
  const { dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [menit, setMenit] = useState(String(t.menitDilaporkan ?? 0))
  const kirim = (hasil: "TERVERIFIKASI" | "BELUM_SELESAI") => {
    dispatch({ type: "VERIFIKASI", tindakanId: t.id, hasil, menit: Math.max(0, Number(menit) || 0) })
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Verifikasi</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verifikasi tindakan</DialogTitle>
          <DialogDescription>
            {t.dijalankan ? `Dilaporkan dijalankan oleh ${t.pelaksana} pukul ${t.waktuTindakan}.` : `Dilaporkan tidak dijalankan: ${t.alasanTidakDijalankan}`} Verifikasi
            adalah pemeriksaan administratif, bukan pengukuran fisiologis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="mv">Menit paparan yang diverifikasi HSE</Label>
          <Input id="mv" type="number" min={0} max={480} value={menit} onChange={(e) => setMenit(e.target.value)} />
          <p className="text-xs text-muted-foreground">Dirancang {t.menitDirencanakan} · dilaporkan {t.menitDilaporkan ?? "Belum tersedia"}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => kirim("BELUM_SELESAI")}>Tandai belum selesai</Button>
          <Button onClick={() => kirim("TERVERIFIKASI")}>Terverifikasi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

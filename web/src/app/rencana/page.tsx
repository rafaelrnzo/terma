"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, ArrowRight, Calculator } from "lucide-react"
import { NextStep, PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { RoleHint } from "@/components/role-hint"
import { QualityBadge, StatusChip } from "@/components/status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { lingkupPekerja } from "@/lib/access"
import { ATURAN_FIXTURE, REGU } from "@/lib/config"
import { rencanaAktif, useApp, useIzin } from "@/lib/store"
import type { ActionStatus } from "@/lib/types"

const URUT: ActionStatus[] = ["BATASI_ATAU_PINDAHKAN", "TINJAU_HSE", "ADAPTASI_DIPERLUKAN", "RENCANA_TERSEDIA"]

export default function RencanaPage() {
  const { state, dispatch, user } = useApp()
  const izin = useIzin()
  const [regu, setRegu] = useState("SEMUA")
  const [persetujuan, setPersetujuan] = useState("SEMUA")

  if (state.pekerja.length === 0)
    return (
      <>
        <PageHeader no="4" title="Rencana & persetujuan" />
        <WorkflowEmpty title="Belum ada pekerja untuk direncanakan" href="/impor" label="Impor data pekerja">Mulai dari data pekerja dan penugasan, lalu lengkapi konfirmasi adaptasi serta pengukuran WBGT.</WorkflowEmpty>
      </>
    )

  const terlihat = new Set(lingkupPekerja(user!, state.pekerja).map((p) => p.kode))
  const semua = rencanaAktif(state).filter((r) => terlihat.has(r.pekerjaKode))
  const daftar = semua
    .filter((r) => regu === "SEMUA" || state.pekerja.find((p) => p.kode === r.pekerjaKode)?.reguKode === regu)
    .filter((r) => persetujuan === "SEMUA" || (persetujuan === "BELUM" ? !r.disetujuiOleh : !!r.disetujuiOleh))
    .sort((a, b) => URUT.indexOf(a.status) - URUT.indexOf(b.status))
  const gagalData = semua.filter((r) => ["PRAKIRAAN_SAJA", "KEDALUWARSA", "TIDAK_TERSEDIA"].includes(r.kualitas))

  return (
    <>
      <PageHeader no="4" title="Rencana kerja" peran="HSE" summary="Pilih pekerja untuk meninjau jadwal, mengubah penugasan, atau menyetujui rencananya.">
        Setiap rencana menggabungkan batas harian adaptasi dan batas interval NAB, dalam menit. Kedua batas harus terpenuhi; persentase
        adaptasi tidak dikalikan dengan persentase baris NAB. Bila beberapa kondisi berlaku, status yang paling ketat dipakai.
      </PageHeader>
      <RoleHint peran={["HSE"]} />

      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Select value={persetujuan} onValueChange={setPersetujuan}>
          <SelectTrigger className="w-52 bg-card" aria-label="Filter persetujuan"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="SEMUA">Semua rencana</SelectItem><SelectItem value="BELUM">Belum disetujui</SelectItem><SelectItem value="SUDAH">Sudah disetujui</SelectItem></SelectContent>
        </Select>
        {state.rencanaDihitung ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Calculator className="size-4 shrink-0" aria-hidden />Rencana diperbarui otomatis saat input berubah.</p> : <Button onClick={() => dispatch({ type: "HITUNG_RENCANA" })} disabled={!izin("HITUNG_RENCANA")}><Calculator />Hitung rencana ({ATURAN_FIXTURE.versi})</Button>}
        {!state.bacaan.some((b) => b.tanggal === state.tanggal) && (
          <span className="text-sm text-muted-foreground">
            Belum ada bacaan WBGT untuk {state.tanggal}: semua rencana akan menjadi TINJAU HSE. <Link href="/pengukuran" className="underline">Impor pengukuran</Link>.
          </span>
        )}
        {user?.role !== "MANDOR" && (
          <Select value={regu} onValueChange={setRegu}>
            <SelectTrigger className="ml-auto w-48 bg-card" aria-label="Filter regu"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA">Semua regu</SelectItem>
              {REGU.map((g) => <SelectItem key={g.kode} value={g.kode}>{g.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {state.rencanaDihitung && (
        <>
          <Card className="accent-summary mb-6 border-0 bg-[image:var(--panel-accent)] py-0">
          <CardContent className="grid gap-x-6 gap-y-4 py-5 sm:grid-cols-2 xl:grid-cols-4">
            {URUT.map((s) => (
              <div key={s} className="flex flex-wrap items-center justify-between gap-3 sm:block">
                <StatusChip status={s} />
                <p className="text-lg font-semibold tabular-nums sm:mt-2">{daftar.filter((r) => r.status === s).length} <span className="text-xs font-normal text-muted-foreground">pekerja</span></p>
              </div>
            ))}
          </CardContent>
          </Card>

          {gagalData.length > 0 && (
            <Alert variant="destructive" className="mb-6 bg-card">
              <AlertTriangle />
              <AlertTitle>Perlu pengukuran: {gagalData.length} rencana tanpa bacaan valid</AlertTitle>
              <AlertDescription>
                {gagalData.map((r) => state.pekerja.find((p) => p.kode === r.pekerjaKode)?.nama).join(", ")}. Status siap tidak dibuat dari prakiraan
                atau bacaan kedaluwarsa; rencana ini menunggu tinjauan HSE.
              </AlertDescription>
            </Alert>
          )}

          <p role="status" className="mb-3 text-sm text-muted-foreground">{daftar.length} rencana ditampilkan · batas dan alasan lengkap tersedia pada rincian pekerja.</p>
          <div className="divide-y rounded-xl bg-card px-4 sm:px-6">
            {daftar.length === 0 && <div className="py-6"><p className="text-muted-foreground">Tidak ada rencana yang cocok dengan filter.</p><Button variant="outline" className="mt-3" onClick={() => { setRegu("SEMUA"); setPersetujuan("SEMUA") }}>Reset filter</Button></div>}
            {daftar.map(r => {
              const p = state.pekerja.find(p => p.kode === r.pekerjaKode)!
              return <Link key={r.id} href={`/pekerja/${p.kode}#rencana`} className="group grid items-center gap-4 py-5 hover:bg-muted/50 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div><p className="font-medium group-hover:text-primary">{p.nama}</p><p className="mt-1 text-xs text-muted-foreground">{p.kode} · {REGU.find(g => g.kode === p.reguKode)?.nama}</p><p className="mt-2 text-xs text-muted-foreground">{r.disetujuiOleh ? "Disetujui HSE" : "Belum disetujui HSE"}</p></div>
                <div><div className="flex flex-wrap gap-2"><StatusChip status={r.status} /><QualityBadge kualitas={r.kualitas} /></div><p className="mt-2 text-sm text-muted-foreground">Rencana paparan: {r.totalKerjaMenit} menit{r.belumLayak && <span className="block text-status-batasi">Sebagian interval belum layak</span>}</p></div>
                <span className="inline-flex items-center gap-2 text-sm font-medium">{user?.role === "MANDOR" ? "Lihat rincian" : "Tinjau rencana"}<ArrowRight className="size-4" aria-hidden /></span>
              </Link>
            })}
          </div>
        </>
      )}

      <NextStep href="/instruksi" label="Instruksi mandor" />
    </>
  )
}

"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, Calculator } from "lucide-react"
import { NextStep, PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { RencanaCard } from "@/components/rencana-card"
import { RoleHint } from "@/components/role-hint"
import { StatusChip } from "@/components/status"
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
    .sort((a, b) => URUT.indexOf(a.status) - URUT.indexOf(b.status))
  const gagalData = semua.filter((r) => ["PRAKIRAAN_SAJA", "KEDALUWARSA", "TIDAK_TERSEDIA"].includes(r.kualitas))

  return (
    <>
      <PageHeader no="4" title="Rencana & persetujuan" peran="HSE" summary="Tinjau batas paparan dan alasan setiap pekerja, lalu setujui rencana kerja-istirahat.">
        Setiap rencana menggabungkan batas harian adaptasi dan batas interval NAB, dalam menit. Kedua batas harus terpenuhi; persentase
        adaptasi tidak dikalikan dengan persentase baris NAB. Bila beberapa kondisi berlaku, status yang paling ketat dipakai.
      </PageHeader>
      <RoleHint peran={["HSE"]} />

      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
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
          <Card className="green-summary mb-6 border-0 bg-[image:var(--panel-green)] py-0">
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

          <div className="grid items-start gap-6 xl:grid-cols-2 xl:[&>div:first-child]:col-span-2 print:block print:space-y-6">
            {daftar.length === 0 && <p className="rounded-md border bg-card p-6 text-muted-foreground">Tidak ada rencana untuk regu ini. Pilih regu lain atau periksa data penugasan.</p>}
            {daftar.map((r) => (
              <RencanaCard key={r.id} r={r} mode={user?.role === "MANDOR" ? "mandor" : "hse"} />
            ))}
          </div>
        </>
      )}

      <NextStep href="/instruksi" label="Instruksi mandor" />
    </>
  )
}

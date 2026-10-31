"use client"

import { NextStep, PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { WorkerAdaptation, Kalender } from "@/components/worker-adaptation"
import { RoleHint } from "@/components/role-hint"
import { Card, CardContent } from "@/components/ui/card"
import { kandidatUntuk, useApp } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"

export default function PaparanPage() {
  const { state: workspace, user } = useApp()
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  if (state.pekerja.length === 0)
    return (
      <>
        <PageHeader no="2" title="Riwayat paparan & adaptasi" />
        <WorkflowEmpty title="Siapkan data pekerja" href="/impor" label="Impor data pekerja">Data pekerja dan riwayat kehadiran diperlukan untuk meninjau kandidat adaptasi.</WorkflowEmpty>
      </>
    )

  const sudahKonfirmasi = new Set(state.konfirmasi.map((k) => k.pekerjaKode))
  const kandidat = state.pekerja.filter((p) => kandidatUntuk(state, p).pemicu)
    .sort((a, b) => Number(sudahKonfirmasi.has(a.kode)) - Number(sudahKonfirmasi.has(b.kode)))
  const lain = state.pekerja.filter((p) => !kandidatUntuk(state, p).pemicu)

  return (
    <>
      <PageHeader no="2" title="Paparan & adaptasi" peran="HSE" summary="Konfirmasi riwayat paparan dan profil adaptasi. Kehadiran saja bukan bukti paparan panas.">
        Sistem menandai kandidat adaptasi dari data kehadiran: pekerja baru, kembali setelah tujuh hari tanpa paparan, atau riwayat yang
        tidak lengkap. Kehadiran hanya pemicu tinjauan. HSE yang mengonfirmasi profil dan hari adaptasi; tanggal mulai kerja saja tidak
        membuktikan adaptasi, dan hari adaptasi tidak maju otomatis setiap pergantian kalender.
      </PageHeader>
      <RoleHint peran={["HSE"]} />

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-heading text-lg font-semibold">Kandidat adaptasi <span className="font-normal text-muted-foreground">({kandidat.length})</span></h2><p className="text-sm text-muted-foreground">{kandidat.filter((p) => !sudahKonfirmasi.has(p.kode)).length} belum dikonfirmasi · ditampilkan lebih dulu</p></div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">Kalender absensi: H = hadir · C = cuti · S = sakit · A = alfa · ? = tidak ada catatan. Kehadiran bukan bukti paparan panas.</p>
      <div data-guide="adaptation" className="grid gap-4">
        {kandidat.length === 0 && <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground">Tidak ada kandidat adaptasi dari riwayat saat ini. Data tanpa pemicu ditampilkan di bawah.</p>}
        {kandidat.map((p) => (
          <WorkerAdaptation key={p.kode} p={p} />
        ))}
      </div>

      <h2 className="mb-4 mt-8 font-heading text-lg font-semibold">Tanpa pemicu adaptasi <span className="font-normal text-muted-foreground">({lain.length})</span></h2>
      <Card>
        <CardContent className="divide-y">
          {lain.length === 0 && <p className="text-sm text-muted-foreground">Semua pekerja memiliki pemicu tinjauan adaptasi.</p>}
          {lain.map((p) => (
            <div key={p.kode} className="flex flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <div className="font-medium">{p.nama}</div>
                <div className="text-xs text-muted-foreground">{kandidatUntuk(state, p).keterangan}</div>
              </div>
              <Kalender p={p} />
            </div>
          ))}
        </CardContent>
      </Card>

      <NextStep />
    </>
  )
}

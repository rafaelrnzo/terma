"use client"

import { Printer } from "lucide-react"
import { PageHeader } from "@/components/app-shell"
import { LifecycleBadge, OriginBadge, QualityBadge, StatusChip } from "@/components/status"
import { Stat } from "@/components/stat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ATURAN_FIXTURE, JAM_SHIFT, LOKASI, ZONA } from "@/lib/config"
import { kualitasBacaan, rentangJam } from "@/lib/rules"
import { kandidatUntuk, rencanaAktif, rencanaTanggal, useApp } from "@/lib/store"
import type { ActionLifecycle, ActionStatus } from "@/lib/types"
import { scopedWorkspace } from "@/lib/workspace"

const STATUSES: ActionStatus[] = ["RENCANA_TERSEDIA", "ADAPTASI_DIPERLUKAN", "TINJAU_HSE", "BATASI_ATAU_PINDAHKAN"]
const LIFE: ActionLifecycle[] = ["DIBUAT", "DISAMPAIKAN", "DIAKUI", "TINDAKAN_DILAPORKAN", "TERVERIFIKASI", "BELUM_SELESAI"]

export default function LaporanPage() {
  const { state: workspace, user } = useApp()
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  const aktif = rencanaAktif(state)
  const idsTanggal = new Set(rencanaTanggal(state).map((r) => r.id))
  const tindakanTanggal = state.tindakan.filter((t) => idsTanggal.has(t.rencanaId))
  const digantikanIds = new Set(rencanaTanggal(state).filter((r) => r.digantikan).map((r) => r.id))
  const dibatalkan = tindakanTanggal.filter((t) => digantikanIds.has(t.rencanaId))
  const jatuhTempo = tindakanTanggal.filter((t) => !digantikanIds.has(t.rencanaId))
  const dilaporkan = jatuhTempo.filter((t) => ["TINDAKAN_DILAPORKAN", "TERVERIFIKASI", "BELUM_SELESAI"].includes(t.status))
  const terverifikasi = jatuhTempo.filter((t) => t.status === "TERVERIFIKASI")
  const kosongUkur = ZONA.flatMap((z) =>
    JAM_SHIFT
      .map((h) => ({ z, h, q: kualitasBacaan(z.kode, state.tanggal, h, state.bacaan, state.prakiraan).kualitas }))
      .filter((x) => x.q !== "TERUKUR" && x.q !== "REPLAY"),
  )
  const belumKonfirmasi = state.pekerja.filter((p) => kandidatUntuk(state, p).pemicu && !state.konfirmasi.some((k) => k.pekerjaKode === p.kode))
  const ditolakImpor = state.imporLog.filter((l, i, arr) => arr.findIndex((x) => x.jenis === l.jenis) === i).flatMap((l) => l.ditolak.map((d) => ({ ...d, jenis: l.jenis })))

  return (
    <>
      <PageHeader no="7" title="Laporan & audit" peran="HSE" summary="Rekap rencana, tindak lanjut, dan kekosongan data dalam satu laporan shift.">
        Laporan menampilkan sumber data dan kekosongannya, bukan hanya persentase kepatuhan. Penyebut setiap persentase ditulis jelas.
      </PageHeader>
      <div className="no-print mb-6">
        <p className="mb-3 text-sm text-muted-foreground">Lingkup laporan: {user.role === "MANDOR" ? `regu ${user.reguKode}. Jejak audit lintas regu dan hasil impor hanya tersedia untuk HSE atau petugas data.` : "seluruh regu pada lokasi ini."}</p>
        <Button variant="outline" onClick={() => window.print()}><Printer /> Cetak laporan</Button>
      </div>

      <div className="space-y-6">
        <Card className="green-summary border-0 bg-[image:var(--panel-green)]">
          <CardHeader>
            <CardTitle>Laporan shift TERMA — {LOKASI}</CardTitle>
            <CardDescription>
              Tanggal rencana {state.tanggal} · aturan {ATURAN_FIXTURE.versi}{ATURAN_FIXTURE.isFixture ? " (belum disahkan sebagai aturan operasional)" : ""}.
              Dicetak {new Date().toLocaleString("id-ID")}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {STATUSES.map((s) => (
              <div key={s} className="border-t pt-4">
                <StatusChip status={s} />
                <div className="mt-2 text-2xl font-semibold tabular-nums">{aktif.filter((r) => r.status === s).length}</div>
                <div className="text-xs text-muted-foreground">dari {aktif.length} rencana aktif</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tindak lanjut</CardTitle>
            <CardDescription>Pengakuan pesan tidak dihitung sebagai tindakan. Kepatuhan administratif tidak otomatis berarti pekerja terlindungi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label={`Dilaporkan, dari ${jatuhTempo.length} tindakan jatuh tempo`} value={`${dilaporkan.length} / ${jatuhTempo.length}`} />
              <Stat label={`Terverifikasi, dari ${jatuhTempo.length} tindakan jatuh tempo`} value={`${terverifikasi.length} / ${jatuhTempo.length}`} />
              <Stat label="Dibatalkan karena perubahan rencana" value={dibatalkan.length} />
              <Stat label="Pesan gagal (belum tersampaikan)" value={state.pengiriman.filter((p) => p.status === "GAGAL").length} />
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {LIFE.map((l) => (
                <span key={l} className="flex items-center gap-1.5"><LifecycleBadge status={l} /> {jatuhTempo.filter((t) => t.status === l).length}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kekosongan data</CardTitle>
            <CardDescription>Setiap data hilang atau kombinasi tidak didukung menghasilkan keluaran yang terlihat.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            <Gap judul={`Interval tanpa bacaan WBGT valid (${kosongUkur.length})`}>
              {kosongUkur.length === 0 ? "Tidak ada." : ZONA.map((z) => {
                const xs = kosongUkur.filter((k) => k.z.kode === z.kode)
                return xs.length ? <div key={z.kode}>{z.nama}: {xs.map((x) => `${rentangJam(x.h)} (${x.q.replace(/_/g, " ")})`).join(", ")}</div> : null
              })}
            </Gap>
            <Gap judul={`Kandidat adaptasi belum dikonfirmasi HSE (${belumKonfirmasi.length})`}>
              {belumKonfirmasi.length ? belumKonfirmasi.map((p) => `${p.nama}: ${kandidatUntuk(state, p).keterangan}`).join(" · ") : "Tidak ada."}
            </Gap>
            <Gap judul={`Baris impor ditolak (${ditolakImpor.length})`}>
              {ditolakImpor.length ? ditolakImpor.map((d) => `${d.jenis} baris ${d.baris}: ${d.alasan}`).join(" · ") : "Tidak ada."}
            </Gap>
            <Gap judul="Interval tanpa alokasi yang memenuhi aturan">
              {aktif.flatMap((r) => r.intervals.filter((i) => i.barisNab === null && (i.kualitas === "TERUKUR" || i.kualitas === "REPLAY")).map((i) => `${state.pekerja.find((p) => p.kode === r.pekerjaKode)?.nama} ${rentangJam(i.jamMulai)}`)).join(", ") || "Tidak ada."}
            </Gap>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Versi rencana</CardTitle>
            <CardDescription>Versi lama tidak dihapus. Perubahan setelah persetujuan memerlukan persetujuan ulang.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="no-print mb-3 text-xs text-muted-foreground xl:hidden">Geser tabel ke samping untuk melihat seluruh kolom.</p>
            <Table className="min-w-[1000px] print:min-w-0" aria-label="Versi rencana, geser untuk melihat seluruh kolom">
              <TableHeader>
                <TableRow>
                  <TableHead>Versi</TableHead>
                  <TableHead>Pekerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kualitas data</TableHead>
                  <TableHead className="text-right">Batas harian</TableHead>
                  <TableHead className="text-right">Rencana</TableHead>
                  <TableHead>Persetujuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rencanaTanggal(state).length === 0 && <TableRow><TableCell colSpan={7} className="py-6 whitespace-normal text-muted-foreground">Belum ada versi rencana untuk tanggal ini.</TableCell></TableRow>}
                {rencanaTanggal(state).sort((a, b) => a.id.localeCompare(b.id)).map((r) => (
                  <TableRow key={r.id} className={r.digantikan ? "text-muted-foreground" : undefined}>
                    <TableCell className="font-mono text-xs">{r.id}{r.digantikan && " (digantikan)"}</TableCell>
                    <TableCell>{state.pekerja.find((p) => p.kode === r.pekerjaKode)?.nama}</TableCell>
                    <TableCell className="min-w-52"><StatusChip status={r.status} className="whitespace-nowrap" /></TableCell>
                    <TableCell className="min-w-36"><QualityBadge kualitas={r.kualitas} /></TableCell>
                    <TableCell className="text-right tabular-nums">{r.batasHarianMenit} mnt</TableCell>
                    <TableCell className="text-right tabular-nums">{r.totalKerjaMenit} mnt</TableCell>
                    <TableCell className="text-xs">{r.disetujuiOleh ?? "belum"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sumber data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[...new Set(state.bacaan.filter((b) => b.tanggal === state.tanggal).map((b) => b.zonaKode))].map((z) => {
              const b = state.bacaan.filter((x) => x.zonaKode === z && x.tanggal === state.tanggal)
              return (
                <div key={z} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{ZONA.find((x) => x.kode === z)?.nama}</span>: {b.length} bacaan, alat {[...new Set(b.map((x) => x.idAlat))].join(", ")}
                  {[...new Set(b.map((x) => x.origin))].map((o) => <OriginBadge key={o} origin={o} />)}
                </div>
              )
            })}
            <div>Prakiraan BMKG: {state.prakiraan.filter((p) => p.tanggal === state.tanggal).length} periode untuk tanggal ini, interval asli dipertahankan. Konteks saja, tidak dipakai untuk status siap.</div>
            <div>Aturan: {ATURAN_FIXTURE.sumber}.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jejak audit ({state.audit.length})</CardTitle>
            <CardDescription>Impor, konfirmasi, versi aturan, persetujuan, pengiriman, tindakan, verifikasi, dan penolakan akses.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="no-print mb-3 text-xs text-muted-foreground lg:hidden">Geser tabel ke samping untuk membaca aktor, aksi, dan detail.</p>
            <Table className="min-w-[760px] print:min-w-0" aria-label="Jejak audit, geser untuk melihat seluruh kolom">
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.audit.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 whitespace-normal text-muted-foreground">{user.role === "MANDOR" ? "Jejak audit lintas regu hanya tersedia untuk HSE atau petugas data." : "Aktivitas impor, persetujuan, dan verifikasi akan tercatat di sini."}</TableCell></TableRow>}
                {state.audit.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{new Date(a.waktu).toLocaleTimeString("id-ID")}</TableCell>
                    <TableCell className="text-xs">{a.aktor}</TableCell>
                    <TableCell className={`font-mono text-xs ${a.aksi === "AKSES_DITOLAK" ? "text-destructive" : ""}`}>{a.aksi}</TableCell>
                    <TableCell className="min-w-80 whitespace-normal text-xs print:min-w-0">{a.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batas klaim</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            Status tindakan bukan pernyataan sehat, bebas risiko, atau izin medis bekerja. Kepatuhan administratif tidak otomatis berarti
            pekerja terlindungi. Durasi dilaporkan atau diverifikasi bukan pengukuran fisiologis. MCU, diagnosis, skor ginjal, defisit minum,
            dan suhu inti wearable tidak memengaruhi keputusan.{ATURAN_FIXTURE.isFixture && " Tabel NAB yang dipakai belum disahkan sebagai aturan operasional."}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function Gap({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <h3 className="mb-2 font-medium">{judul}</h3>
      <div className="max-w-prose leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

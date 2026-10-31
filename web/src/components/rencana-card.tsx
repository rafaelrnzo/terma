"use client"

import { useState } from "react"
import { WarningIcon as AlertTriangle, ArrowsLeftRightIcon as ArrowRightLeft, CheckCircleIcon as CheckCircle2 } from "@phosphor-icons/react"
import { QualityBadge, StatusChip } from "@/components/status"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { REGU, TUGAS, ZONA } from "@/lib/config"
import { namaZona, rentangJam } from "@/lib/rules"
import { useApp, useIzin } from "@/lib/store"
import type { Rencana } from "@/lib/types"

const fmt = (n: number) => n.toFixed(1).replace(".", ",")

export function RencanaCard({ r, mode = "hse" }: { r: Rencana; mode?: "hse" | "mandor" }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const p = state.pekerja.find((x) => x.kode === r.pekerjaKode)!
  const tugas = TUGAS.find((t) => t.kode === r.tugasKode)!
  const riwayat = state.rencana.filter((x) => x.pekerjaKode === r.pekerjaKode && x.digantikan).sort((a, b) => b.version - a.version)

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{p.nama}</CardTitle>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{r.id}</p>
            <div className="mt-1 text-sm text-muted-foreground">
              {REGU.find((g) => g.kode === p.reguKode)?.nama} · {tugas.nama} (beban {tugas.beban.toLowerCase()}) · {namaZona(r.zonaKode)}
            </div>
          </div>
          <div className="flex max-w-full flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Status tindakan</span>
              <StatusChip status={r.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Kualitas data</span>
              <QualityBadge kualitas={r.kualitas} />
            </div>
          </div>
        </div>
        {r.belumLayak && (
          <Alert variant="destructive" className="bg-card">
            <AlertTriangle />
            <AlertTitle>RENCANA BELUM LAYAK untuk sebagian interval</AlertTitle>
            <AlertDescription>Tidak ada alokasi yang memenuhi aturan pada jam yang ditandai. Sistem tidak memaksakan alokasi untuk target produksi.</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 border-y py-4 sm:grid-cols-3 sm:gap-6">
          <Limit label="Batas harian (adaptasi)" value={`${r.batasHarianMenit} menit`} sub={r.batasHarianMenit === 0 ? "tidak ada paparan sampai ditinjau" : `${r.persenAdaptasi}% dari 480 menit`} />
          <Limit label="Batas interval (NAB)" value={`${r.intervals.reduce((s, i) => s + i.kerjaMaksMenit, 0)} menit`} sub="jumlah maks per jam dari aturan" />
          <Limit label="Direncanakan" value={`${r.totalKerjaMenit} menit`} sub="tidak melewati kedua batas" strong />
        </div>

        <Accordion type="single" collapsible defaultValue={r.belumLayak ? "interval" : undefined}>
          <AccordionItem value="interval">
            <AccordionTrigger>Jadwal per interval · {r.intervals.length} jam kerja</AccordionTrigger>
            <AccordionContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Interval</TableHead>
              <TableHead>ISBB</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Baris NAB</TableHead>
              <TableHead className="text-right">Maks</TableHead>
              <TableHead className="text-right">Rencana kerja</TableHead>
              <TableHead className="text-right">Istirahat / tugas lain dinilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.intervals.map((iv) => (
              <TableRow key={iv.jamMulai} className={iv.barisNab === null ? "bg-muted/60" : undefined} title={iv.catatan}>
                <TableCell className="tabular-nums">{rentangJam(iv.jamMulai)}</TableCell>
                <TableCell className="tabular-nums">{iv.isbb !== null ? `${fmt(iv.isbb)}°C` : "Belum tersedia"}</TableCell>
                <TableCell><QualityBadge kualitas={iv.kualitas} /></TableCell>
                <TableCell className="text-xs">
                  {iv.barisNab ?? <span className="font-medium text-status-batasi">{iv.isbb !== null && (iv.kualitas === "TERUKUR" || iv.kualitas === "REPLAY") ? "tidak ada alokasi" : "perlu pengukuran"}</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{iv.kerjaMaksMenit}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{iv.kerjaDirencanakan}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{60 - iv.kerjaDirencanakan}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell className="text-right tabular-nums">{r.totalKerjaMenit}</TableCell>
              <TableCell className="text-right tabular-nums">{480 - r.totalKerjaMenit}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible defaultValue={r.status !== "RENCANA_TERSEDIA" ? "alasan" : undefined}>
          <AccordionItem value="alasan">
            <AccordionTrigger>Lihat alasan ({r.alasan.length}) dan usulan ({r.usulan.length})</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {r.alasan.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
              {r.usulan.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Usulan perubahan (perlu persetujuan HSE)</div>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {r.usulan.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
              )}
              <div className="text-xs text-muted-foreground">Aturan {r.aturanVersi}. Label status bukan pernyataan sehat atau izin medis.</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {r.disetujuiOleh ? (
              <span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="size-3.5" /> Disetujui {r.disetujuiOleh} · {new Date(r.waktuPersetujuan!).toLocaleTimeString("id-ID")}</span>
            ) : (
              "Belum disetujui HSE"
            )}
            {riwayat.length > 0 && (
              <span className="ml-3">
                Riwayat versi: {riwayat.map((v) => `${v.id}${v.disetujuiOleh ? " (disetujui, digantikan)" : " (digantikan)"}`).join(" · ")}
              </span>
            )}
          </div>
          {mode === "hse" && (
            <div className="no-print flex flex-wrap gap-2">
              {izin("UBAH_PENUGASAN") && <UbahPenugasan pekerjaKode={r.pekerjaKode} zonaAwal={r.zonaKode} tugasAwal={r.tugasKode} />}
              {!r.disetujuiOleh && <Button disabled={!izin("SETUJUI_RENCANA")} onClick={() => dispatch({ type: "SETUJUI", rencanaId: r.id })}>
                {r.version > 1 ? "Setujui ulang" : "Setujui rencana"}
              </Button>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Limit({ label, value, sub, strong }: { label: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${strong ? "text-foreground" : "text-muted-foreground"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  )
}

function UbahPenugasan({ pekerjaKode, zonaAwal, tugasAwal }: { pekerjaKode: string; zonaAwal: string; tugasAwal: string }) {
  const { dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [zona, setZona] = useState(zonaAwal)
  const [tugas, setTugas] = useState(tugasAwal)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft /> Ubah penugasan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah penugasan</DialogTitle>
          <DialogDescription>Rencana dihitung ulang. Jika rencana sudah disetujui, versi baru dibuat dan perlu persetujuan ulang; versi lama tetap tersimpan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="ub-zona">Zona</Label>
            <Select value={zona} onValueChange={setZona}>
              <SelectTrigger id="ub-zona" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{ZONA.map((z) => <SelectItem key={z.kode} value={z.kode}>{z.nama}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ub-tugas">Tugas</Label>
            <Select value={tugas} onValueChange={setTugas}>
              <SelectTrigger id="ub-tugas" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{TUGAS.map((t) => <SelectItem key={t.kode} value={t.kode}>{t.nama} (beban {t.beban.toLowerCase()})</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              dispatch({ type: "UBAH_PENUGASAN", pekerjaKode, zonaKode: zona, tugasKode: tugas })
              setOpen(false)
            }}
          >
            Simpan & hitung ulang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

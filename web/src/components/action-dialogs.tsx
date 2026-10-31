"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/store"
import type { Tindakan } from "@/lib/types"

export function LaporDialog({ t }: { t: Tindakan }) {
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
        <Button size="sm">{t.status === "BELUM_SELESAI" ? "Perbaiki laporan" : t.status === "TINDAKAN_DILAPORKAN" ? "Perbarui laporan" : "Catat tindakan"}</Button>
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

export function VerifikasiDialog({ t }: { t: Tindakan }) {
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

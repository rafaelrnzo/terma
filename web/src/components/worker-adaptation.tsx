"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { persenAdaptasi } from "@/lib/rules"
import { kandidatUntuk, useApp, useIzin } from "@/lib/store"
import type { AcclProfile, Pekerja } from "@/lib/types"
import { cn } from "@/lib/utils"

const LABEL_PEMICU = {
  PEKERJA_BARU: "Pekerja baru",
  KEMBALI_TANPA_PAPARAN: "Kembali ≥ 7 hari tanpa paparan",
  RIWAYAT_TIDAK_LENGKAP: "Riwayat tidak lengkap",
} as const

const LABEL_PROFIL: Record<AcclProfile | "NORMAL", string> = {
  PEKERJA_BARU: "Pekerja baru (20%, +20 poin/hari)",
  BERPENGALAMAN_KEMBALI: "Berpengalaman kembali (50/60/80/100%)",
  NORMAL: "Normal (tidak perlu adaptasi)",
}

export function WorkerAdaptation({ p, compact = false, onSaved }: { p: Pekerja; compact?: boolean; onSaved?: () => void }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const k = kandidatUntuk(state, p)
  const konf = state.konfirmasi.find((x) => x.pekerjaKode === p.kode)
  const [profil, setProfil] = useState<AcclProfile | "NORMAL">(konf?.profil ?? k.saranProfil)
  const [hari, setHari] = useState(String(konf?.hariAdaptasi ?? 1))
  const persen = persenAdaptasi(profil, Number(hari))

  return (
    <Card data-compact={compact} className={cn(!konf && "border-status-tinjau")}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            {p.nama} <span className="font-mono text-xs font-normal text-muted-foreground">{p.kode}</span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-sm">{k.pemicu && LABEL_PEMICU[k.pemicu]}</Badge>
            {konf ? (
              <Badge variant="outline" className="rounded-sm border-primary text-primary">Dikonfirmasi {konf.dikonfirmasiOleh}</Badge>
            ) : (
              <Badge variant="tinjau">BELUM DIKONFIRMASI</Badge>
            )}
          </div>
        </div>
        <CardDescription>{k.keterangan}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div data-adaptation-calendar className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Kehadiran (dari absensi, 14 hari)</div>
            <Kalender p={p} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Paparan terkonfirmasi</div>
            <div className="text-sm">
              {konf
                ? `Profil ${LABEL_PROFIL[konf.profil].split(" (")[0].toLowerCase()}, hari adaptasi ke-${konf.hariAdaptasi}`
                : "Belum ada. Hadir tidak sama dengan terpapar; mandor atau HSE mengonfirmasi riwayat paparan."}
            </div>
          </div>
        </div>
        <div className="space-y-4 border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <div className="space-y-1">
              <Label htmlFor={`profil-${p.kode}`}>Profil adaptasi</Label>
              <Select value={profil} onValueChange={value => { if (value === "PEKERJA_BARU" || value === "BERPENGALAMAN_KEMBALI" || value === "NORMAL") setProfil(value) }} disabled={!izin("KONFIRMASI_PAPARAN")}>
                <SelectTrigger id={`profil-${p.kode}`} className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["PEKERJA_BARU", "BERPENGALAMAN_KEMBALI", "NORMAL"] as const).map((x) => (
                    <SelectItem key={x} value={x}>
                      {LABEL_PROFIL[x]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`hari-${p.kode}`}>Hari ke-</Label>
              <Select value={hari} onValueChange={setHari} disabled={profil === "NORMAL" || !izin("KONFIRMASI_PAPARAN")}>
                <SelectTrigger id={`hari-${p.kode}`} className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-sm">
            Batas harian: <span className="font-semibold tabular-nums">{persen}% × 480 = {Math.round((persen / 100) * 480)} menit</span>
            <div className="text-xs text-muted-foreground">Batas interval NAB tetap diperiksa terpisah di langkah rencana.</div>
          </div>
          <Button disabled={!izin("KONFIRMASI_PAPARAN")} onClick={() => { dispatch({ type: "KONFIRMASI", pekerjaKode: p.kode, profil, hari: profil === "NORMAL" ? 1 : Number(hari) }); onSaved?.() }}>
            {konf ? "Perbarui konfirmasi" : "Konfirmasi riwayat paparan"}
          </Button>
          <p className="text-xs text-muted-foreground">Jadwal adaptasi bukan jaminan toleransi individu.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function Kalender({ p }: { p: Pekerja }) {
  const { state } = useApp()
  const hari: string[] = []
  const end = new Date(state.tanggal + "T00:00:00Z")
  for (let i = 14; i >= 1; i--) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - i)
    hari.push(d.toISOString().slice(0, 10))
  }
  const tanggalPendek = (date: string) => new Date(date + "T00:00:00Z").toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" })
  return (
    <div className="max-w-full">
    <p className="mb-2 text-xs text-muted-foreground">{tanggalPendek(hari[0])}–{tanggalPendek(hari[13])}</p>
    <div className="grid w-fit grid-cols-[repeat(7,28px)] gap-1 xl:grid-cols-[repeat(14,28px)]" role="list" aria-label={`Kehadiran 14 hari ${p.nama}`}>
      {hari.map((h) => {
        const k = state.kehadiran.find((x) => x.pekerjaKode === p.kode && x.tanggal === h)
        return (
          <span
            key={h}
            role="listitem"
            aria-label={`${h}: ${k?.status ?? "tidak ada catatan"}`}
            title={`${h}: ${k?.status ?? "tidak ada catatan"}`}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-xs tabular-nums text-muted-foreground" aria-hidden>{Number(h.slice(8))}</span>
            <span aria-hidden className={cn(
              "flex size-7 items-center justify-center rounded-sm border text-xs font-medium",
              k?.status === "HADIR" && "border-primary/40 bg-primary/15 text-primary",
              (k?.status === "CUTI" || k?.status === "SAKIT" || k?.status === "ALFA") && "border-status-adaptasi/40 bg-status-adaptasi/15 text-status-adaptasi",
              !k && "border-dashed text-muted-foreground",
            )}
            >
            {k ? k.status[0] : "?"}
            </span>
          </span>
        )
      })}
    </div>
    </div>
  )
}

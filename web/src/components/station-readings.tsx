"use client"

import Link from "next/link"
import { WeatherConnection } from "@/components/weather-connection"
import { useState } from "react"
import { ThermometerIcon as Thermometer } from "@phosphor-icons/react/dist/csr/Thermometer"
import { OriginBadge, QualityBadge } from "@/components/status"
import { RoleHint } from "@/components/role-hint"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/ui/option-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ATURAN_FIXTURE, JAM_SHIFT, ZONA } from "@/lib/config"
import { jam, kualitasBacaan, rentangJam, usiaBacaanMenit } from "@/lib/rules"
import { useApp, useIzin } from "@/lib/store"
import type { Workload } from "@/lib/types"

const fmt = (n: number) => n.toFixed(1).replace(".", ",")
const BEBAN: Workload[] = ["RINGAN", "SEDANG", "BERAT", "SANGAT_BERAT"]

/** ISBB readings per zone and hour (Station and manual), shown as a tab of shift monitoring. */
export function StationReadings() {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const boleh = izin("INPUT_PENGUKURAN")
  const [zona, setZona] = useState(ZONA[0].kode)
  const [jamMulai, setJamMulai] = useState(String(JAM_SHIFT[0]))
  const [isbb, setIsbb] = useState("")
  const [alat, setAlat] = useState("")
  const [kalibrasi, setKalibrasi] = useState("")
  const [error, setError] = useState("")

  const bacaanHariIni = state.bacaan.filter((b) => b.tanggal === state.tanggal)
  const sumberAlat = [...new Set(bacaanHariIni.map((b) => `${b.zonaKode}|${b.idAlat}`))]

  return (
    <>
      <RoleHint peran={["PETUGAS_DATA", "HSE"]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border bg-card p-5"><div><h2 className="text-sm font-semibold">Bacaan TERMA Station</h2><p className="mt-1 text-xs text-muted-foreground">Station mengirim otomatis setiap 30 detik; nilai tertinggi tiap jam dicatat sebagai bacaan aktual di zona penempatannya. Bila Station tidak terhubung, catat bacaan alat ukur pada formulir di bawah.</p></div><Button asChild variant="outline"><Link href="/perangkat">Status perangkat</Link></Button></div>
      <Card>
        <CardHeader>
          <CardTitle>Bacaan per zona</CardTitle>
          <CardDescription>
            {state.tanggal} · {bacaanHariIni.length} bacaan. Nilai dan kualitas sumber ditampilkan terpisah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bacaanHariIni.length === 0 ? (
            <div className="flex flex-col items-start gap-4 border-t pt-5 sm:flex-row sm:items-center">
              <Thermometer className="size-8 shrink-0 text-muted-foreground" aria-hidden />
              <div className="flex-1">
                <h3 className="font-medium">Perlu pengukuran di lokasi</h3>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">Belum ada bacaan untuk {ZONA.length} zona dan {JAM_SHIFT.length} interval. Bacaan dari Station masuk melalui sinkronisasi perangkat pada alur shift.</p>
              </div>
              <Button asChild variant="outline"><a href="#input-pengukuran">Tambah bacaan</a></Button>
            </div>
          ) : <>
          <p className="mb-3 text-xs text-muted-foreground">Geser tabel ke samping bila seluruh interval belum terlihat.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                {JAM_SHIFT.map((h) => (
                  <TableHead key={h} className="text-center">{jam(h)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ZONA.map((z) => (
                <TableRow key={z.kode}>
                  <TableCell className="font-medium">{z.nama}</TableCell>
                  {JAM_SHIFT.map((h) => {
                    const { kualitas, reading } = kualitasBacaan(z.kode, state.tanggal, h, state.bacaan, state.prakiraan)
                    return (
                      <TableCell
                        key={h}
                        className="px-1 text-center align-top"
                        title={reading ? `${reading.idAlat} · ${reading.pencatat} · diambil ${new Date(reading.waktuCatat).toLocaleString("id-ID")} (${usiaBacaanMenit(reading)} mnt sebelum interval)` : undefined}
                      >
                        <div className={`text-sm font-semibold tabular-nums ${reading && reading.isbb >= 31 ? "text-status-batasi" : ""}`}>{reading ? `${fmt(reading.isbb)}°` : "Belum diukur"}</div>
                        <div className="mt-1 flex justify-center">
                          <QualityBadge kualitas={kualitas} className="text-xs" />
                        </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>}
          {sumberAlat.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {sumberAlat.map((key) => {
                const b = bacaanHariIni.find((x) => `${x.zonaKode}|${x.idAlat}` === key)!
                return (
                  <div key={key} className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-foreground">{ZONA.find((z) => z.kode === b.zonaKode)?.nama.split(" (")[0]}</span><OriginBadge origin={b.origin} /></div>
                    <p className="max-w-prose leading-relaxed">Alat {b.idAlat} · pencatat {b.pencatat} · kalibrasi: {b.kalibrasi}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div id="input-pengukuran" className="mt-8 scroll-mt-6">
        <h2 className="text-lg font-semibold">Tambah pengukuran</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bacaan utama berasal dari Station. Catatan manual tersedia untuk alat pengukuran tambahan.</p>
      </div>
      <div className="mt-4 grid items-start gap-6 xl:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle>Catat bacaan manual</CardTitle>
            <CardDescription>Waktu catat = sekarang. Bacaan untuk jam yang belum tiba akan terhitung kedaluwarsa, karena panas belum bisa diukur sebelum terjadi.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                const v = Number(isbb.replace(",", "."))
                if (!isFinite(v) || v < 15 || v > 45) return setError("ISBB harus angka antara 15 dan 45 °C. Periksa kembali bacaan alat.")
                if (!alat.trim()) return setError("ID alat wajib diisi agar sumber bacaan dapat ditelusuri.")
                setError("")
                dispatch({ type: "INPUT_BACAAN", zonaKode: zona, jamMulai: Number(jamMulai), isbb: v, idAlat: alat.trim(), kalibrasi: kalibrasi.trim() })
                setIsbb("")
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="in-zona">Zona</Label>
                <Select value={zona} onValueChange={setZona} disabled={!boleh}>
                  <SelectTrigger id="in-zona" className="w-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{ZONA.map((z) => <SelectItem key={z.kode} value={z.kode}>{z.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="in-jam">Interval</Label>
                <OptionSelect id="in-jam" value={jamMulai} onValueChange={setJamMulai} disabled={!boleh} options={JAM_SHIFT.map(hour=>({value:String(hour),label:rentangJam(hour)}))} searchPlaceholder="Cari interval jam…" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="in-isbb">ISBB (°C)</Label>
                <Input id="in-isbb" inputMode="decimal" placeholder="mis. 28,6" value={isbb} onChange={(e) => { setIsbb(e.target.value); setError("") }} aria-invalid={!!error && error.startsWith("ISBB")} aria-describedby={error ? "bacaan-error" : undefined} required disabled={!boleh} className="bg-card" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="in-alat">ID alat</Label>
                <Input id="in-alat" value={alat} onChange={(e) => { setAlat(e.target.value); setError("") }} aria-invalid={!!error && error.startsWith("ID alat")} aria-describedby={error ? "bacaan-error" : undefined} required disabled={!boleh} className="bg-card" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="in-kal">Info kalibrasi</Label>
                <Input id="in-kal" placeholder="mis. Sertifikat 2026-08" value={kalibrasi} onChange={(e) => setKalibrasi(e.target.value)} disabled={!boleh} className="bg-card" />
              </div>
              {error && <p id="bacaan-error" role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <div className="border-t pt-4 sm:col-span-2"><Button type="submit" disabled={!boleh}>Catat bacaan</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8"><WeatherConnection /><Button asChild variant="outline"><Link href="/forecasting">Buka peta prakiraan BMKG</Link></Button></div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Aturan {ATURAN_FIXTURE.versi}: NAB ISBB (°C) per alokasi kerja per jam</CardTitle>
          <CardDescription>
            {ATURAN_FIXTURE.sumber}. APD didukung: {ATURAN_FIXTURE.apdDidukung.join(", ")}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ATURAN_FIXTURE.isFixture && (
            <Alert className="bg-background">
              <AlertTitle>Belum disahkan sebagai aturan operasional</AlertTitle>
              <AlertDescription>Angka perlu diverifikasi ke naskah resmi Permenaker 5/2018 dan ditinjau HSE. Sel kosong berarti kombinasi tidak didukung, bukan nol.</AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alokasi kerja per jam</TableHead>
                {BEBAN.map((w) => (
                  <TableHead key={w}>{w.replace("_", " ").toLowerCase()}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ATURAN_FIXTURE.rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell>{r.label} (maks {r.kerjaMaksMenit} mnt)</TableCell>
                  {BEBAN.map((w) => (
                    <TableCell key={w} className="tabular-nums">
                      {r.nab[w] !== undefined ? fmt(r.nab[w]!) : <span className="text-muted-foreground">tidak didukung</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </>
  )
}

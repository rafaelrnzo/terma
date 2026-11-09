"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ZONA } from "@/lib/config"
import { stationPlacements } from "@/lib/station-placement"
import { useApp } from "@/lib/store"

/** Coordinates are captured from a pin placed on the map above this form. */
export function StationPlacementPanel({ picked }: { picked: { lat: number; lng: number } | null }) {
  const { state, user, dispatch } = useApp()
  const [deviceId, setDeviceId] = useState("")
  const [location, setLocation] = useState("")
  const [globe, setGlobe] = useState("0")
  if (!user) return null
  const canEdit = user.role === "ADMIN" || user.role === "HSE" || user.role === "PETUGAS_DATA"
  const rows = stationPlacements(state)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!picked) return
    dispatch({ type: "SIMPAN_PENEMPATAN_STATION", deviceId, namaLokasi: location, lat: picked.lat, lng: picked.lng, selisihGlobe: Number(globe.replace(",", ".")) })
  }
  return <section className="summon-panel mt-6" aria-labelledby="station-placement-title">
    <div className="panel-heading"><div><h2 id="station-placement-title">Penempatan TERMA Station</h2><p>Klik peta untuk menaruh pin, lalu beri nama lokasi dan Station.</p></div></div>
    {canEdit && <form onSubmit={submit} className="grid gap-4 border-b p-5 sm:grid-cols-2 xl:grid-cols-[10rem_minmax(12rem,1fr)_9rem_9rem_auto] xl:items-end">
      <div className="space-y-2"><Label htmlFor="placement-device">ID Station</Label><Input id="placement-device" value={deviceId} onChange={event => setDeviceId(event.target.value.toUpperCase())} placeholder="TST-02" required pattern={"[A-Za-z0-9_\\-]{2,32}"} /></div>
      <div className="space-y-2"><Label htmlFor="placement-location">Nama lokasi baru</Label><Input id="placement-location" value={location} onChange={event => setLocation(event.target.value)} placeholder="Contoh: Area produksi utara" minLength={2} maxLength={80} required /></div>
      <div className="space-y-2"><Label htmlFor="placement-lat">Lintang dari peta</Label><Input id="placement-lat" value={picked?.lat.toFixed(6) ?? ""} placeholder="Klik peta" readOnly required /></div>
      <div className="space-y-2"><Label htmlFor="placement-lng">Bujur dari peta</Label><Input id="placement-lng" value={picked?.lng.toFixed(6) ?? ""} placeholder="Klik peta" readOnly required /></div>
      <Button type="submit" disabled={!picked}>Simpan penempatan</Button>
      <div className="space-y-2 sm:col-span-2 xl:col-span-4"><Label htmlFor="placement-globe">Selisih bola hitam − udara (°C)</Label><Input id="placement-globe" inputMode="decimal" value={globe} onChange={event => setGlobe(event.target.value)} className="max-w-40" /><p className="text-xs text-muted-foreground">0 = teduh · terbuka: Tg − Ta</p></div>
      <p className="text-xs text-muted-foreground sm:col-span-2 xl:col-span-5" role="status">{picked ? `Pin dipilih: ${picked.lat.toFixed(6)}, ${picked.lng.toFixed(6)}. Klik titik lain pada peta untuk memindahkannya.` : "Buka OpenStreetMap dan klik titik pemasangan Station untuk mengisi koordinat."}</p>
    </form>}
    <div className="overflow-x-auto"><Table aria-label="Station terpasang"><TableHeader><TableRow><TableHead>Station</TableHead><TableHead>Lokasi</TableHead><TableHead>Koordinat</TableHead><TableHead>Selisih globe</TableHead><TableHead>Dipasang</TableHead>{canEdit && <TableHead>Aksi</TableHead>}</TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.deviceId}>
        <TableCell className="font-medium">{row.deviceId}</TableCell>
        <TableCell>{row.namaLokasi ?? ZONA.find(item => item.kode === row.zonaKode)?.nama ?? row.zonaKode}</TableCell>
        <TableCell className="tabular-nums">{row.lat.toFixed(5)}, {row.lng.toFixed(5)}</TableCell>
        <TableCell>{row.selisihGlobe ? `${String(row.selisihGlobe).replace(".", ",")} °C` : "Teduh (0)"}</TableCell>
        <TableCell>{new Date(row.dipasangPada).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · {row.oleh}</TableCell>
        {canEdit && <TableCell><Button size="sm" variant="ghost" onClick={() => dispatch({ type: "HAPUS_PENEMPATAN_STATION", deviceId: row.deviceId })}>Lepas</Button></TableCell>}
      </TableRow>)}</TableBody></Table></div>
    {!rows.length && <p className="p-6 text-sm text-muted-foreground">Belum ada Station terpasang.</p>}
  </section>
}

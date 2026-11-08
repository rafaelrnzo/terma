"use client"

import { useState, type FormEvent } from "react"
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/ui/option-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ZONA } from "@/lib/config"
import { stationPlacements } from "@/lib/station-placement"
import { useApp } from "@/lib/store"

/** Records where each physical TERMA Station is installed. Coordinates come from a map click, this device's GPS, or typing. */
export function StationPlacementPanel({ picked }: { picked: { lat: number; lng: number } | null }) {
  const { state, user, dispatch } = useApp()
  const [deviceId, setDeviceId] = useState("TST-01")
  const [zone, setZone] = useState(ZONA[0].kode)
  const [globe, setGlobe] = useState("0")
  const [typed, setTyped] = useState<{ lat: string; lng: string } | null>(null)
  const [locating, setLocating] = useState("")
  const [lastPick, setLastPick] = useState(picked)
  if (picked !== lastPick) { setLastPick(picked); setTyped(null) } // a new map click replaces typed coordinates only
  if (!user) return null
  const canEdit = user.role === "HSE" || user.role === "PETUGAS_DATA"
  const rows = stationPlacements(state)
  const coords = typed ?? (picked ? { lat: picked.lat.toFixed(6), lng: picked.lng.toFixed(6) } : { lat: "", lng: "" })
  function useDeviceLocation() {
    if (!navigator.geolocation) { setLocating("Perangkat ini tidak menyediakan lokasi."); return }
    setLocating("Mengambil lokasi…")
    navigator.geolocation.getCurrentPosition(
      position => { setTyped({ lat: position.coords.latitude.toFixed(6), lng: position.coords.longitude.toFixed(6) }); setLocating(`Akurasi ±${Math.round(position.coords.accuracy)} m`) },
      () => setLocating("Izin lokasi ditolak atau lokasi tidak tersedia. Klik peta atau ketik koordinat."),
      { enableHighAccuracy: true, timeout: 10000 })
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    dispatch({ type: "SIMPAN_PENEMPATAN_STATION", deviceId, zonaKode: zone, lat: Number(coords.lat), lng: Number(coords.lng), selisihGlobe: Number(globe.replace(",", ".")) })
    setTyped(null)
  }
  return <section className="summon-panel mt-6" aria-labelledby="station-placement-title">
    <div className="panel-heading"><div><h2 id="station-placement-title">Penempatan TERMA Station</h2><p>Zona dan titik pasang tiap Station.</p></div></div>
    {canEdit && <form onSubmit={submit} className="grid gap-4 border-b p-5 sm:grid-cols-2 xl:grid-cols-[10rem_minmax(12rem,1fr)_9rem_9rem_auto] xl:items-end">
      <div className="space-y-2"><Label htmlFor="placement-device">ID Station</Label><Input id="placement-device" value={deviceId} onChange={event => setDeviceId(event.target.value.toUpperCase())} required pattern="[A-Za-z0-9_-]{2,32}" /></div>
      <div className="space-y-2"><Label htmlFor="placement-zone">Zona kerja</Label><OptionSelect id="placement-zone" value={zone} onValueChange={setZone} options={ZONA.map(row => ({ value: row.kode, label: row.nama }))} /></div>
      <div className="space-y-2"><Label htmlFor="placement-lat">Lintang</Label><Input id="placement-lat" inputMode="decimal" value={coords.lat} onChange={event => setTyped({ ...coords, lat: event.target.value })} placeholder="-6.17600" required /></div>
      <div className="space-y-2"><Label htmlFor="placement-lng">Bujur</Label><Input id="placement-lng" inputMode="decimal" value={coords.lng} onChange={event => setTyped({ ...coords, lng: event.target.value })} placeholder="106.82700" required /></div>
      <div className="space-y-2 sm:col-span-2 xl:col-span-4"><Label htmlFor="placement-globe">Selisih bola hitam − udara (°C)</Label><Input id="placement-globe" inputMode="decimal" value={globe} onChange={event => setGlobe(event.target.value)} className="max-w-40" /><p className="text-xs text-muted-foreground">0 = teduh · terbuka: Tg − Ta</p></div>
      <Button type="submit">Simpan penempatan</Button>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 xl:col-span-5"><Button type="button" variant="outline" size="sm" onClick={useDeviceLocation}><MapPinIcon />Gunakan lokasi perangkat ini</Button><p className="text-xs text-muted-foreground" role="status">{locating || "Atau klik titik pemasangan pada peta di atas."}</p></div>
    </form>}
    <Table aria-label="Station terpasang"><TableHeader><TableRow><TableHead>Station</TableHead><TableHead>Zona</TableHead><TableHead>Koordinat</TableHead><TableHead>Selisih globe</TableHead><TableHead>Dipasang</TableHead>{canEdit && <TableHead>Aksi</TableHead>}</TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.deviceId}>
        <TableCell className="font-medium">{row.deviceId}</TableCell>
        <TableCell>{ZONA.find(item => item.kode === row.zonaKode)?.nama ?? row.zonaKode}</TableCell>
        <TableCell className="tabular-nums">{row.lat.toFixed(5)}, {row.lng.toFixed(5)}</TableCell>
        <TableCell className="tabular-nums">{row.selisihGlobe ? `${String(row.selisihGlobe).replace(".", ",")} °C` : "Teduh (0)"}</TableCell>
        <TableCell>{new Date(row.dipasangPada).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · {row.oleh}</TableCell>
        {canEdit && <TableCell><Button size="sm" variant="ghost" onClick={() => dispatch({ type: "HAPUS_PENEMPATAN_STATION", deviceId: row.deviceId })}>Lepas</Button></TableCell>}
      </TableRow>)}</TableBody></Table>
    {!rows.length && <p className="p-6 text-sm text-muted-foreground">Belum ada Station terpasang.</p>}
  </section>
}

"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { managementOf } from "@/lib/management-state"
import { stationWbgt, type IotEvent } from "@/lib/iot"
import { useIotEvents } from "@/lib/use-iot-events"
import { useApp } from "@/lib/store"

const KIND = { station: "TERMA Station", water: "Water Station", water_heartbeat: "Water Station", band: "TERMA Band" } as const
const ONLINE_MS = 90_000
const time = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit" })

/** Live view of what each physical device last sent to /api/iot. */
export function LiveDevices() {
  const { state, user } = useApp()
  const { events, connected } = useIotEvents()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [])
  const workers = managementOf(state).workers
  const devices = [...new Map(events.map(event => [event.deviceId, event])).keys()].sort()

  return <Card>
    <CardHeader>
      <CardTitle>Perangkat terhubung</CardTitle>
      <CardDescription>Data nyata dari alat lewat WiFi, langsung saat dikirim · server {connected === false ? "tidak terhubung" : "terhubung"}.</CardDescription>
    </CardHeader>
    <CardContent>
      {connected === false ? <p className="text-sm text-muted-foreground">Server IoT belum dapat dihubungi. Halaman tersambung sendiri setelah server IoT aktif.</p>
        : !devices.length ? <p className="text-sm text-muted-foreground">Belum ada perangkat yang mengirim data. Pastikan alat dan laptop berada di WiFi yang sama.</p>
        : <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{devices.map(id => {
          const own = events.filter(event => event.deviceId === id)
          const last = own.at(-1)!
          const online = now - Date.parse(last.receivedAt) <= ONLINE_MS
          return <li key={id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <div><p className="font-medium">{id}</p><p className="text-xs text-muted-foreground">{KIND[last.type]}</p></div>
              <Badge variant={online ? "riskGreen" : "kualitas"}>{online ? "Online" : "Tidak mengirim"}</Badge>
            </div>
            <p className="mt-3 text-sm">{detail(own, user?.role === "KLINIK", workers)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Terakhir {time(last.receivedAt)} · {own.length} kiriman</p>
          </li>
        })}</ul>}
    </CardContent>
  </Card>
}

function detail(own: IotEvent[], clinic: boolean, workers: { kode: string; nama: string; kartuUid?: string }[]) {
  const last = own.at(-1)!
  switch (last.type) {
    case "station": return `ISBB ${stationWbgt(last).isbb} °C · udara ${last.airC} °C · RH ${last.humidityPct}% · bola basah ${last.wetBulbC ?? "—"} °C`
    case "band": return clinic ? `Denyut ${last.heartRate ?? "—"} bpm · kulit ${last.skinC ?? "—"} °C` : "Bacaan diterima · nilai hanya untuk Klinik"
    case "water":
    case "water_heartbeat": {
      const tap = own.findLast(event => event.type === "water")
      if (tap?.type !== "water") return "Siap, belum ada tap kartu"
      const worker = workers.find(row => row.kartuUid === tap.uid)
      return `Tap terakhir ${time(tap.receivedAt)}: ${worker ? worker.nama : `kartu ${tap.uid} belum terdaftar`}`
    }
  }
}

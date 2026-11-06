"use client"

import { ArrowClockwiseIcon, CloudSunIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { BMKG_SITE } from "@/lib/bmkg"
import { useApp } from "@/lib/store"

export function WeatherConnection() {
  const { state, refreshWeather } = useApp()
  const weather = state.weather
  const loading = !weather || weather.status === "loading"
  return <section className="summon-panel mb-6 flex flex-wrap items-center gap-4 p-5" aria-label="Koneksi data BMKG"><CloudSunIcon size={27} className="shrink-0 text-primary" /><div className="min-w-0 flex-1 basis-56"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">BMKG · {weather?.data?.location ?? BMKG_SITE.label}</h2><span role="status" className="text-xs text-muted-foreground">{loading ? "Memperbarui prakiraan…" : weather.status === "ready" ? "Terhubung" : "Pembaruan tertunda"}</span></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{weather?.data ? `${weather.data.records.length} periode · diperbarui ${new Date(weather.data.fetchedAt).toLocaleString("id-ID")} · periode 3 jam` : "Prakiraan diambil otomatis dari sumber BMKG untuk lokasi acuan proyek."}</p>{weather?.status === "error" && <p role="alert" className="mt-2 text-sm text-destructive">{weather.error}{weather.data ? " Data BMKG terakhir masih dapat dilihat." : " Belum ada data yang dapat ditampilkan."}</p>}</div><Button variant="outline" size="sm" disabled={loading} onClick={() => void refreshWeather()}><ArrowClockwiseIcon />Perbarui cuaca</Button><a href="https://data.bmkg.go.id/prakiraan-cuaca/" target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-4">Sumber: BMKG</a></section>
}

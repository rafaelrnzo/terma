"use client"

import { useState } from "react"
import { CloudSunIcon } from "@phosphor-icons/react/dist/csr/CloudSun"
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin"
import { ThermometerIcon } from "@phosphor-icons/react/dist/csr/Thermometer"
import { DropIcon } from "@phosphor-icons/react/dist/csr/Drop"
import { PageHeader } from "@/components/app-shell"
import { ZoneMap } from "@/components/zone-map"
import { WeatherConnection } from "@/components/weather-connection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BMKG_MAP_CENTER, forecastPeriodLabel } from "@/lib/bmkg"
import { hariIni, ZONA } from "@/lib/config"
import { forecastAtPeriod, forecastHours } from "@/lib/forecast"
import { currentShift } from "@/lib/management-state"
import { jam } from "@/lib/rules"
import { useApp } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"

export default function ForecastingPage() {
  const { state, user } = useApp()
  const [requestedDate, setDate] = useState<string | null>(null)
  const [requestedHour, setHour] = useState(9)
  const [zoneCode, setZone] = useState(ZONA[0].kode)
  if (!user) return null
  const shift = currentShift(state)
  const records = state.weather?.data?.records ?? []
  const date = requestedDate ?? (records.some(record => record.tanggal === state.tanggal) ? state.tanggal : records[0]?.tanggal ?? hariIni())
  const hours = records.some(record => record.tanggal === date) ? forecastHours(records, date) : []
  const hour = hours.includes(requestedHour) ? requestedHour : hours[0] ?? 0
  const forecast = forecastAtPeriod(records, date, hour)
  const selected = ZONA.find(zone => zone.kode === zoneCode) ?? ZONA[0]
  const scoped = scopedWorkspace(state, user)
  const accessible = shift && (user.role !== "MANDOR" || scoped.pekerja.length > 0)
  const workerCount = accessible ? scoped.penugasan.filter(assignment => assignment.zonaKode === selected.kode).length : 0
  const periods = hours.map(start => ({ start, forecast: forecastAtPeriod(records, date, start) }))
  const available = periods.flatMap(period => period.forecast ? [period.forecast] : [])
  const peak = available.toSorted((a, b) => b.suhu - a.suhu)[0]
  const low = available.toSorted((a, b) => a.suhu - b.suhu)[0]
  const fmt = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 })
  return <>
    <PageHeader title="Prakiraan cuaca" summary="Cuaca BMKG per lokasi dan periode." />

    <WeatherConnection />
    <section className="summon-panel forecast-workspace" aria-label="Prakiraan cuaca pada peta">
      <div className="forecast-filters"><div><Label htmlFor="forecast-date">Tanggal prakiraan</Label><Input id="forecast-date" type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value) }} /></div><div><p className="mb-2 text-sm font-medium" id="forecast-period-label">Mulai periode</p><div className="forecast-periods" role="group" aria-labelledby="forecast-period-label">{!hours.length && <p className="text-sm text-muted-foreground">Tidak ada periode BMKG untuk tanggal ini.</p>}{hours.map(start => <Button key={start} variant="ghost" aria-pressed={hour === start} onClick={() => setHour(start)}>{jam(start)}</Button>)}</div></div></div>
      <div className="forecast-map-grid"><ZoneMap center={state.weather?.data ? [state.weather.data.longitude, state.weather.data.latitude] : BMKG_MAP_CENTER} title="Peta prakiraan lokasi" zones={ZONA.map(zone => ({ ...zone, value: forecast ? `${fmt(forecast.suhu)} °C · RH ${fmt(forecast.kelembapan)}%` : "Prakiraan belum tersedia" }))} selected={selected.kode} onZone={setZone} caption="Satu prakiraan lokasi berlaku sebagai konteks untuk seluruh zona. Warna membedakan zona; belum ada prediksi panas tersendiri per zona." />
        <aside className="forecast-readout" aria-live="polite"><p className="eyebrow"><MapPinIcon size={14} />ZONA DIPILIH</p><h2>{selected.nama}</h2><p className="text-sm text-muted-foreground">{workerCount} pekerja dalam lingkup Anda pada shift yang dibuka</p><div className="forecast-temperature"><ThermometerIcon size={23} /><strong>{forecast ? `${fmt(forecast.suhu)}°` : "—"}</strong><span>Suhu udara</span></div><p className="flex items-center gap-2 text-sm"><DropIcon size={18} />Kelembapan {forecast ? `${fmt(forecast.kelembapan)}%` : "belum tersedia"}</p>{forecast ? <><p className="forecast-source"><strong>BMKG · {forecast.kondisi ?? "Prakiraan lokasi"}</strong>{forecastPeriodLabel(forecast)} · {forecast.intervalJam} jam<br />{forecast.lokasi}<br />Diproduksi {new Date(forecast.waktuProduksi).toLocaleString("id-ID")}</p><p className="text-sm text-muted-foreground">Nilai ini adalah suhu udara, bukan WBGT. Ukur WBGT di zona sebelum HSE menetapkan batas kerja.</p></> : <div className="forecast-source"><strong>Belum ada prakiraan</strong><p>Belum ada periode BMKG untuk tanggal ini. Pilih tanggal yang tersedia atau perbarui cuaca.</p></div>}</aside></div>
    </section>
    <section className="summon-panel mt-6" aria-labelledby="forecast-timeline"><div className="panel-heading"><div><h2 id="forecast-timeline">Bandingkan periode kerja</h2><p>Bandingkan suhu dan kelembapan pada interval asli BMKG.</p></div></div><div className="forecast-timeline">{periods.map(period => <button key={period.start} className="forecast-period-card" aria-pressed={hour === period.start} onClick={() => setHour(period.start)}><CloudSunIcon size={22} weight={hour === period.start ? "fill" : "regular"} /><span>{period.forecast ? forecastPeriodLabel(period.forecast) : jam(period.start)}</span><strong>{period.forecast ? `${fmt(period.forecast.suhu)} °C` : "Belum ada data"}</strong><small>{period.forecast ? `${period.forecast.kondisi ?? "Prakiraan"} · RH ${fmt(period.forecast.kelembapan)}%` : "Menunggu BMKG"}</small></button>)}</div>{peak && low && <p className="px-5 pb-5 text-sm text-muted-foreground">Suhu tertinggi pada data tersedia: {jam(peak.jamMulai)} ({fmt(peak.suhu)} °C). Terendah: {jam(low.jamMulai)} ({fmt(low.suhu)} °C). Bandingkan untuk persiapan jadwal; kelayakan kerja tetap ditinjau HSE menggunakan WBGT.</p>}</section>
  </>
}

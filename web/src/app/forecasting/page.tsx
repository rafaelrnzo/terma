"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRightIcon, CloudSunIcon, MapPinIcon, ThermometerIcon, DropIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { ZoneMap } from "@/components/zone-map"
import { CsvImporter } from "@/components/csv-importer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZONA } from "@/lib/config"
import { forecastAtPeriod, forecastHours } from "@/lib/forecast"
import { currentShift } from "@/lib/management-state"
import { jam } from "@/lib/rules"
import { useApp, useIzin } from "@/lib/store"
import { TEMPLATE } from "@/lib/templates"
import { scopedWorkspace } from "@/lib/workspace"

export default function ForecastingPage() {
  const { state, user, dispatch } = useApp()
  const izin = useIzin()
  const [date, setDate] = useState(state.tanggal)
  const [requestedHour, setHour] = useState(9)
  const [zoneCode, setZone] = useState(ZONA[0].kode)
  if (!user) return null
  const shift = currentShift(state)
  const hours = forecastHours(state.prakiraan, date)
  const hour = hours.includes(requestedHour) ? requestedHour : hours[0]
  const forecast = forecastAtPeriod(state.prakiraan, date, hour)
  const selected = ZONA.find(zone => zone.kode === zoneCode) ?? ZONA[0]
  const scoped = scopedWorkspace(state, user)
  const accessible = shift && (user.role !== "MANDOR" || scoped.pekerja.length > 0)
  const workerCount = accessible ? scoped.penugasan.filter(assignment => assignment.zonaKode === selected.kode).length : 0
  const periods = hours.map(start => ({ start, forecast: forecastAtPeriod(state.prakiraan, date, start) }))
  const available = periods.flatMap(period => period.forecast ? [period.forecast] : [])
  const peak = available.toSorted((a, b) => b.suhu - a.suhu)[0]
  const low = available.toSorted((a, b) => a.suhu - b.suhu)[0]
  const fmt = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 })
  return <>
    <PageHeader title="Forecasting" summary="Lihat prakiraan cuaca pada peta sebelum menyusun jadwal. Pilih tanggal, periode, dan zona yang ingin ditinjau." />
    <div className="forecast-intro"><CloudSunIcon size={24} /><div><strong>Dipakai sebelum rencana kerja disetujui</strong><p>{user.role === "PETUGAS_DATA" ? "Tugas Anda: lengkapi data prakiraan agar HSE dapat membandingkan periode kerja." : user.role === "MANDOR" ? "Gunakan untuk memahami cuaca yang diprakirakan. Ikuti instruksi kerja yang sudah disetujui HSE." : "Bandingkan waktu kerja, kemudian tinjau bacaan WBGT dan setujui rencana di alur shift."}</p></div><Button asChild variant="outline"><Link href={accessible ? `/shift/${shift.id}` : "/ringkasan"}>{accessible ? "Ke rencana shift" : "Pilih shift"}<ArrowRightIcon /></Link></Button></div>
    <section className="summon-panel forecast-workspace" aria-label="Prakiraan cuaca pada peta">
      <div className="forecast-filters"><div><Label htmlFor="forecast-date">Tanggal prakiraan</Label><Input id="forecast-date" type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value) }} /></div><div><p className="mb-2 text-sm font-medium" id="forecast-period-label">Mulai periode</p><div className="forecast-periods" role="group" aria-labelledby="forecast-period-label">{hours.map(start => <Button key={start} variant="ghost" aria-pressed={hour === start} onClick={() => setHour(start)}>{jam(start)}</Button>)}</div></div></div>
      <div className="forecast-map-grid"><ZoneMap title="Peta prakiraan lokasi" zones={ZONA.map(zone => ({ ...zone, value: forecast ? `${fmt(forecast.suhu)} °C · RH ${fmt(forecast.kelembapan)}%` : "Prakiraan belum tersedia" }))} selected={selected.kode} onZone={setZone} caption="Satu prakiraan lokasi berlaku sebagai konteks untuk seluruh zona. Warna membedakan zona; belum ada prediksi panas tersendiri per zona." />
        <aside className="forecast-readout" aria-live="polite"><p className="eyebrow"><MapPinIcon size={14} />ZONA DIPILIH</p><h2>{selected.nama}</h2><p className="text-sm text-muted-foreground">{workerCount} pekerja dalam lingkup Anda pada shift yang dibuka</p><div className="forecast-temperature"><ThermometerIcon size={23} /><strong>{forecast ? `${fmt(forecast.suhu)}°` : "—"}</strong><span>Suhu udara</span></div><p className="flex items-center gap-2 text-sm"><DropIcon size={18} />Kelembapan {forecast ? `${fmt(forecast.kelembapan)}%` : "belum tersedia"}</p>{forecast ? <><p className="forecast-source"><strong>PRAKIRAAN LOKASI</strong>{jam(forecast.jamMulai)}–{jam(forecast.jamMulai + forecast.intervalJam)} · {forecast.intervalJam} jam<br />{forecast.lokasi}<br />Diproduksi {new Date(forecast.waktuProduksi).toLocaleString("id-ID")}</p><p className="text-sm text-muted-foreground">Nilai ini adalah suhu udara, bukan WBGT. Ukur WBGT di zona sebelum HSE menetapkan batas kerja.</p></> : <div className="forecast-source"><strong>Belum ada prakiraan</strong><p>Belum ada data untuk tanggal dan periode ini. Pilih periode lain atau minta petugas data mengimpor prakiraan.</p></div>}</aside></div>
    </section>
    <section className="summon-panel mt-6" aria-labelledby="forecast-timeline"><div className="panel-heading"><div><h2 id="forecast-timeline">Bandingkan periode kerja</h2><p>Interval asli sumber dipertahankan; periode kosong tetap terlihat.</p></div></div><div className="forecast-timeline">{periods.map(period => <button key={period.start} className="forecast-period-card" aria-pressed={hour === period.start} onClick={() => setHour(period.start)}><CloudSunIcon size={22} weight={hour === period.start ? "fill" : "regular"} /><span>{jam(period.start)}{period.forecast && `–${jam(period.start + period.forecast.intervalJam)}`}</span><strong>{period.forecast ? `${fmt(period.forecast.suhu)} °C` : "Belum ada data"}</strong><small>{period.forecast ? `RH ${fmt(period.forecast.kelembapan)}%` : "Perlu data prakiraan"}</small></button>)}</div>{peak && low && <p className="px-5 pb-5 text-sm text-muted-foreground">Suhu tertinggi pada data tersedia: {jam(peak.jamMulai)} ({fmt(peak.suhu)} °C). Terendah: {jam(low.jamMulai)} ({fmt(low.suhu)} °C). Bandingkan untuk persiapan jadwal; kelayakan kerja tetap ditinjau HSE menggunakan WBGT.</p>}</section>
    {user.role !== "MANDOR" && <section className="mt-6"><h2 className="mb-2 text-lg font-semibold">Sumber data prakiraan</h2><p className="mb-4 text-sm text-muted-foreground">Data berasal dari impor CSV. Sinkronisasi BMKG otomatis belum terhubung. {shift?.status === "CLOSED" ? "Shift sudah ditutup; buka draft lain untuk menambahkan data." : !shift ? "Buka draft shift untuk menyimpan data prakiraan." : `Data disimpan pada ${shift.nama}.`}</p>{shift && shift.status !== "CLOSED" && <CsvImporter id="forecast" title="Impor prakiraan cuaca" description="Kolom: tanggal, lokasi, jam_mulai, interval_jam, suhu, kelembapan, waktu_produksi. Gunakan lokasi dan waktu produksi dari sumber." template={TEMPLATE.prakiraan} disabled={!izin("INPUT_PENGUKURAN")} result={state.imporLog.find(log => log.jenis === "prakiraan")} onImport={(csv, source) => dispatch({ type: "IMPOR_PRAKIRAAN", csv, source })} />}</section>}
  </>
}

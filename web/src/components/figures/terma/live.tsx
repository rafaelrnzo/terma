"use client"

import { OptionSelect } from "@/components/ui/option-select"
import { useState, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import Link from "next/link"
import { ThermometerIcon } from "@phosphor-icons/react/dist/csr/Thermometer"
import { DropIcon } from "@phosphor-icons/react/dist/csr/Drop"
import { HeartbeatIcon } from "@phosphor-icons/react/dist/csr/Heartbeat"
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu"
import { SquaresFourIcon } from "@phosphor-icons/react/dist/csr/SquaresFour"
import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause"
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play"
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight"
import { useApp } from "@/lib/store"
import { ZONA } from "@/lib/config"
import { type DeviceSelection } from "@/lib/device-telemetry"
import { stationWbgt } from "@/lib/iot"
import { managementOf } from "@/lib/management-state"
import { useIotEvents } from "@/lib/use-iot-events"
import { DEVICE_ANCHORS } from "./generated-view"
import { InstrumentActivity, BandSignal } from "./activity"
import { useInstrumentLoop } from "./use-instrument-loop"
import { StationAnatomy, WetBulbInspection } from "./station-anatomy"

const controls = [
  { id: "all", label: "Seluruh alat", Icon: SquaresFourIcon },
  { id: "station", label: "Station", Icon: ThermometerIcon },
  { id: "water", label: "Water Station", Icon: DropIcon },
  { id: "band", label: "Band", Icon: HeartbeatIcon },
  { id: "gateway", label: "Gateway", Icon: CpuIcon },
] satisfies { id: DeviceSelection; label: string; Icon: typeof CpuIcon }[]

export function IotLive({ art, focused = false }: { art: ReactNode; focused?: boolean }) {
  const { state, user } = useApp()
  const [selection, select] = useState<DeviceSelection>(focused ? "station" : "all")
  const [inspectWetBulb, inspect] = useState(false)
  const [zone, setZone] = useState(focused ? state.penugasan[0]?.zonaKode ?? "COR_B" : "COR_B")
  // The drawing animates; every number below comes from real device events (null = no reading yet).
  const { root, svg, paused, reducedMotion, toggle } = useInstrumentLoop(zone, selection, inspectWetBulb)
  const { events, connected } = useIotEvents()
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  const station = events.findLast(event => event.type === "station" && event.zone === zone)
  const wbgt = station?.type === "station" ? stationWbgt(station).isbb : null
  const taps = events.filter(event => event.type === "water" && new Date(event.receivedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }) === today)
  const lastTap = taps.at(-1)
  const visitor = lastTap?.type === "water" ? managementOf(state).workers.find(worker => worker.kartuUid === lastTap.uid) : undefined
  const band = events.findLast(event => event.type === "band")
  const clinic = user?.role === "KLINIK" || user?.role === "ADMIN"
  const heartRate = clinic && band?.type === "band" ? band.heartRate : null
  const skin = clinic && band?.type === "band" ? band.skinC : null
  const wearer = band ? currentShiftWearer(state, band.deviceId) : undefined
  const last = events.at(-1)
  const updated = last ? new Date(last.receivedAt).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) : ""
  const kinds = new Set(events.map(event => event.deviceId))
  const fixed = (value: number | null, digits = 1) => value === null ? "—" : value.toLocaleString("id-ID", { maximumFractionDigits: digits })
  const name = selection === "water" ? "Smart Water Station" : selection === "band" ? "TERMA Band" : selection === "gateway" ? "TERMA Gateway" : "TERMA Station"
  const readout = selection === "water" ? `${taps.length} kunjungan RFID` : selection === "band" ? (band ? (clinic ? `${fixed(heartRate, 0)} bpm · ${fixed(skin)} °C` : "Bacaan diterima · nilai untuk Klinik") : "Belum ada bacaan Band") : selection === "gateway" ? `${events.length} kiriman diterima` : `WBGT ${fixed(wbgt)} °C`
  function choose(id: DeviceSelection) { select(id); inspect(false) }
  return <section ref={root} className="iso iot-workbench summon-panel" data-selected={selection} data-inspection={inspectWetBulb ? "wetbulb" : "assembly"} data-guide="iot-workbench" aria-labelledby="iot-bench-title">
    <header className="iot-bench-heading"><div><p className="eyebrow">PERANGKAT LAPANGAN</p><h2 id="iot-bench-title">{focused ? "Station membaca zona peserta" : "Setiap pembacaan terhubung."}</h2><p>{focused ? "Periksa zona dan nilai WBGT. Simpan bacaan melalui tugas Sensor untuk menggunakannya pada rencana shift." : "Station · Water Station · Band"}</p></div><span className="connected-note"><span className="status-dot text-primary" />{connected === false ? "Server IoT tidak terhubung" : connected ? "Server IoT terhubung" : "Menghubungkan…"}</span></header>
    {!focused && <div className="iot-controls" data-guide="device-controls" role="group" aria-label="Pilih perangkat">{controls.map(control => <button key={control.id} aria-pressed={selection === control.id} onClick={() => choose(control.id)}><control.Icon size={16} weight={selection === control.id ? "fill" : "regular"} />{control.label}</button>)}</div>}
    <div className="iot-bench-layout"><figure className="iot-figure" aria-labelledby="iot-figure-caption">
      <div className="iot-figure-top"><span>FIG. 01</span>{selection === "station" ? <WetBulbInspection inspecting={inspectWetBulb} onInspect={() => inspect(value => !value)} /> : <span>TERMA / LOKASI 1</span>}</div>
      <svg ref={svg} className="iso-svg" viewBox="0 0 900 540" role="img" aria-label={inspectWetBulb ? "Potongan natural wet bulb: sumbu basah pada sensor di udara, dengan ujung sumbu masuk ke air reservoir" : `Meja perangkat TERMA. ${selection === "all" ? "Station, Water Station, Band, dan gateway" : name}`}>
        {art}
        <InstrumentActivity />
        <g className="iot-radio-rings" aria-hidden="true">{Object.entries(DEVICE_ANCHORS).map(([key, point]) => <circle key={key} data-signal={key} cx={point[0]} cy={point[1]} r="6" opacity=".2" />)}</g>
      </svg>
      <div className="iot-figure-bottom"><span>{inspectWetBulb ? "Potongan reservoir & sumbu wet bulb" : focused ? "WBGT untuk rencana shift" : "Pilih perangkat untuk melihat detail"}</span><div><output data-readout>{readout}</output><button onClick={toggle} aria-label={reducedMotion ? "Aktifkan animasi perangkat" : paused ? "Lanjutkan aktivitas perangkat" : "Jeda aktivitas perangkat"}>{reducedMotion || paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}{reducedMotion ? "Aktifkan animasi" : paused ? "Lanjutkan" : "Jeda"}</button></div></div>
      <figcaption id="iot-figure-caption" className="sr-only">Station mengirim WBGT, pembaca RFID mencatat kunjungan air minum, dan Band mengirim detak jantung serta suhu kulit ke gateway.</figcaption>
      {reducedMotion && <p className="iot-motion-preference">Gerakan mengikuti pengaturan perangkat. Pilih Aktifkan animasi untuk menyalakannya.</p>}
    </figure>
    <aside className="iot-detail" aria-label="Detail pembacaan perangkat"><div className="iot-detail-title"><p className="eyebrow">{selection === "all" ? "BACAAN TERBARU" : "DETAIL PERANGKAT"}</p><h3>{name}</h3><p>{selection === "water" ? `${lastTap?.deviceId ?? "Water Station"} · titik air minum` : selection === "band" ? `${band?.deviceId ?? "Band"} · ${wearer?.nama ?? "belum diserahkan ke pekerja"}` : selection === "gateway" ? "terma-iot · server lokasi" : `${station?.deviceId ?? "Belum ada Station"} · ${ZONA.find(item => item.kode === zone)?.nama}`}</p></div>
      {(selection === "all" || selection === "station") && <><Metric label="WBGT / ISBB" value={wbgt} unit="°C" hero /><div className="iot-metric-pair"><Metric label="Suhu udara" value={station?.type === "station" ? station.airC : null} unit="°C" /><Metric label="Kelembapan" value={station?.type === "station" ? station.humidityPct : null} unit="% RH" /></div><label className="iot-zone-label" htmlFor="iot-zone">Station zona</label><OptionSelect id="iot-zone" value={zone} onValueChange={setZone} options={ZONA.map(item=>({value:item.kode,label:item.nama}))} /></>}
      {selection === "station" && <StationAnatomy />}
      {selection === "water" && <><Metric label="Kunjungan hari ini" value={taps.length} unit="tap" hero /><p className="iot-detail-copy">{lastTap?.type === "water" ? `${visitor?.nama ?? `Kartu ${lastTap.uid} belum terdaftar`} · tap terakhir ${new Date(lastTap.receivedAt).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}.` : "Belum ada tap kartu hari ini."}</p><p className="iot-detail-footnote">Tap mencatat kunjungan ke titik minum, bukan volume air.</p></>}
      {selection === "band" && <><Metric label="Detak jantung" value={heartRate} unit="bpm" hero /><div className="iot-metric-pair"><Metric label="Suhu kulit" value={skin} unit="°C" /><Metric label="Terakhir" value={null} unit={band ? new Date(band.receivedAt).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }) : ""} /></div><p className="iot-detail-copy">{clinic ? "Denyut dan suhu kulit dikirim Band lewat WiFi setiap 10 detik saat dipakai." : "Nilai denyut dan suhu kulit hanya terlihat oleh Klinik."}</p><BandSignal large /></>}
      {selection === "gateway" && <><Metric label="Kiriman diterima" value={events.length} unit="kiriman" hero /><div className="iot-metric-pair"><Metric label="Station" value={[...kinds].filter(id => events.some(event => event.deviceId === id && event.type === "station")).length} unit="unit" /><Metric label="Perangkat personal" value={[...kinds].filter(id => events.some(event => event.deviceId === id && event.type !== "station")).length} unit="unit" /></div><p className="iot-detail-copy">Server terma-iot menerima pembacaan Station, kunjungan RFID, dan data Band lewat WiFi.</p></>}
      <div className="iot-last-update"><span className="status-dot text-primary" /><span>{updated ? `Pembaruan ${updated}` : "Belum ada kiriman perangkat"}</span><span>{last ? `#${String(last.seq).padStart(4, "0")}` : ""}</span></div>
    </aside></div>
    {!focused && <div className="iot-summary-strip"><button onClick={() => choose("station")}><ThermometerIcon size={17} /><span>Station <strong>{fixed(wbgt)} °C</strong></span></button><button onClick={() => choose("water")}><DropIcon size={17} /><span>Water Station <strong>{taps.length} kunjungan</strong></span></button><button onClick={() => choose("band")}><HeartbeatIcon size={17} /><span>Band <strong>{clinic ? `${fixed(heartRate, 0)} bpm` : band ? "aktif" : "—"}</strong></span><BandSignal /></button><Link href={state.management?.activeId ? `/shift/${state.management.activeId}` : "/ringkasan"}>Ke alur shift<ArrowUpRightIcon size={15} /></Link></div>}
  </section>
}

function Metric({ label, value, unit, hero = false }: { label: string; value: number | null; unit: string; hero?: boolean }) {
  return <dl className={hero ? "iot-metric iot-metric-hero" : "iot-metric"}><dt>{label}</dt><dd>{value === null ? "—" : <NumberFlow value={value} locales="id-ID" format={{ maximumFractionDigits: 1 }} />}<span>{unit}</span></dd></dl>
}

function currentShiftWearer(state: ReturnType<typeof useApp>["state"], bandId: string) {
  const shift = managementOf(state).shifts.find(row => row.id === managementOf(state).activeId)
  const code = shift?.bands?.find(row => row.bandId === bandId && row.dipakaiPada && !row.dikembalikanPada && !row.dibatalkanPada)?.pekerjaKode
  return code ? managementOf(state).workers.find(worker => worker.kode === code) : undefined
}

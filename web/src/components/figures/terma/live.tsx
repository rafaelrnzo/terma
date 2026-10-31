"use client"

import { useState, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import Link from "next/link"
import { ThermometerIcon, DropIcon, HeartbeatIcon, CpuIcon, SquaresFourIcon, PauseIcon, PlayIcon, ArrowUpRightIcon, IdentificationCardIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"
import { ZONA } from "@/lib/config"
import { type DeviceSelection } from "@/lib/device-telemetry"
import { DEVICE_ANCHORS } from "./generated-view"
import { InstrumentActivity, BandSignal } from "./activity"
import { useInstrumentLoop } from "./use-instrument-loop"

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
  const [zone, setZone] = useState(focused ? state.penugasan[0]?.zonaKode ?? "COR_B" : "COR_B")
  const { root, svg, frame, paused, reducedMotion, updated, tap, toggle } = useInstrumentLoop(zone, selection)
  const scope = user ? scopedWorkspace(state, user) : state
  const visitor = scope.pekerja.length ? scope.pekerja[(Math.max(frame.visits, 1) - 1) % scope.pekerja.length] : undefined
  const wearer = scope.pekerja[0]
  const name = selection === "water" ? "Smart Water Station" : selection === "band" ? "TERMA Band" : selection === "gateway" ? "TERMA Gateway" : "TERMA Station"
  const readout = selection === "water" ? `${frame.visits} kunjungan RFID` : selection === "band" ? `${frame.heartRate} bpm · ${frame.skinTemperature.toLocaleString("id-ID")} °C` : selection === "gateway" ? `${frame.packets} paket diterima` : `WBGT ${frame.wbgt.toLocaleString("id-ID")} °C`
  function choose(id: DeviceSelection) { select(id) }
  return <section ref={root} className="iso iot-workbench summon-panel" data-selected={selection} data-guide="iot-workbench" aria-labelledby="iot-bench-title">
    <header className="iot-bench-heading"><div><p className="eyebrow">PERANGKAT LAPANGAN</p><h2 id="iot-bench-title">{focused ? "Station membaca zona peserta" : "Setiap pembacaan terhubung."}</h2><p>{focused ? "Periksa zona dan nilai WBGT. Simpan bacaan melalui tugas Sensor untuk menggunakannya pada rencana shift." : "Panas lingkungan, kunjungan minum, dan respons tubuh dalam satu aliran perangkat."}</p></div><span className="connected-note"><span className="status-dot text-primary" />{reducedMotion ? "Gerakan dikurangi" : paused ? "Tampilan dijeda" : "Gateway aktif"}</span></header>
    {!focused && <div className="iot-controls" data-guide="device-controls" role="group" aria-label="Pilih perangkat">{controls.map(control => <button key={control.id} aria-pressed={selection === control.id} onClick={() => choose(control.id)}><control.Icon size={16} weight={selection === control.id ? "fill" : "regular"} />{control.label}</button>)}</div>}
    <div className="iot-bench-layout"><figure className="iot-figure" aria-labelledby="iot-figure-caption">
      <div className="iot-figure-top"><span>FIG. 01</span><span>TERMA / LOKASI 1</span></div>
      <svg ref={svg} className="iso-svg" viewBox="0 0 900 540" role="img" aria-label={`Meja perangkat TERMA. ${selection === "all" ? "Station, Water Station, Band, dan gateway" : name}`}>
        {art}
        <InstrumentActivity />
        <g className="iot-radio-rings" aria-hidden="true">{Object.entries(DEVICE_ANCHORS).map(([key, point]) => <circle key={key} data-signal={key} cx={point[0]} cy={point[1]} r="6" opacity=".2" />)}</g>
      </svg>
      <div className="iot-figure-bottom"><span>{focused ? "WBGT untuk rencana shift" : "Pilih perangkat untuk melihat detail"}</span><div><output data-readout>{readout}</output><button onClick={toggle} aria-label={reducedMotion ? "Aktifkan animasi perangkat" : paused ? "Lanjutkan aktivitas perangkat" : "Jeda aktivitas perangkat"}>{reducedMotion || paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}{reducedMotion ? "Aktifkan animasi" : paused ? "Lanjutkan" : "Jeda"}</button></div></div>
      <figcaption id="iot-figure-caption" className="sr-only">Station mengirim WBGT, pembaca RFID mencatat kunjungan air minum, dan Band mengirim detak jantung serta suhu kulit ke gateway.</figcaption>
      {reducedMotion && <p className="iot-motion-preference">Gerakan mengikuti pengaturan perangkat. Pilih Aktifkan animasi untuk menyalakannya.</p>}
    </figure>
    <aside className="iot-detail" aria-label="Detail pembacaan perangkat"><div className="iot-detail-title"><p className="eyebrow">{selection === "all" ? "BACAAN TERBARU" : "DETAIL PERANGKAT"}</p><h3>{name}</h3><p>{selection === "water" ? "WS-01 · Titik air minum utama" : selection === "band" ? `TB-01 · ${wearer?.nama ?? "Unit band 01"}` : selection === "gateway" ? "GW-01 · Gateway lokasi" : `TST-${zone} · ${ZONA.find(item => item.kode === zone)?.nama}`}</p></div>
      {(selection === "all" || selection === "station") && <><Metric label="WBGT / ISBB" value={frame.wbgt} unit="°C" hero /><div className="iot-metric-pair"><Metric label="Suhu udara" value={frame.air} unit="°C" /><Metric label="Kelembapan" value={frame.humidity} unit="% RH" /></div><label className="iot-zone-label" htmlFor="iot-zone">Station zona</label><select id="iot-zone" className="management-select" value={zone} onChange={event => setZone(event.target.value)}>{ZONA.map(item => <option key={item.kode} value={item.kode}>{item.nama}</option>)}</select></>}
      {selection === "water" && <><Metric label="Kunjungan tercatat" value={frame.visits} unit="tap" hero /><p className="iot-detail-copy">{frame.visits ? `${visitor?.nama ?? "Kartu terdaftar #014"} · kunjungan terakhir diterima gateway.` : "Pembaca RFID siap menerima kartu pekerja."}</p><Button className="w-full" onClick={tap}><IdentificationCardIcon />Tap kartu pekerja</Button><p className="iot-detail-footnote">Tap mencatat kunjungan ke titik minum.</p></>}
      {selection === "band" && <><Metric label="Detak jantung" value={frame.heartRate} unit="bpm" hero /><div className="iot-metric-pair"><Metric label="Suhu kulit" value={frame.skinTemperature} unit="°C" /><Metric label="Baterai" value={frame.battery} unit="%" /></div><p className="iot-detail-copy">PPG dan suhu kulit dikirim melalui BLE. Indikator cahaya mengikuti denyut pembacaan.</p><BandSignal large /></>}
      {selection === "gateway" && <><Metric label="Paket diterima" value={frame.packets} unit="paket" hero /><div className="iot-metric-pair"><Metric label="Station" value={3} unit="unit" /><Metric label="Perangkat personal" value={2} unit="unit" /></div><p className="iot-detail-copy">Gateway menerima pembacaan Station, kunjungan RFID, dan data BLE Band dalam satu urutan pembaruan.</p></>}
      <div className="iot-last-update"><span className="status-dot text-primary" /><span>{updated ? `Pembaruan ${updated}` : "Menyiapkan pembacaan…"}</span><span>#{String(frame.sequence + 1).padStart(4, "0")}</span></div>
    </aside></div>
    {!focused && <div className="iot-summary-strip"><button onClick={() => choose("station")}><ThermometerIcon size={17} /><span>Station <strong>{frame.wbgt.toLocaleString("id-ID")} °C</strong></span></button><button onClick={() => choose("water")}><DropIcon size={17} /><span>Water Station <strong>{frame.visits} kunjungan</strong></span></button><button onClick={() => choose("band")}><HeartbeatIcon size={17} /><span>Band <strong>{frame.heartRate} bpm</strong></span><BandSignal /></button><Link href={state.management?.activeId ? `/shift/${state.management.activeId}` : "/ringkasan"}>Ke alur shift<ArrowUpRightIcon size={15} /></Link></div>}
  </section>
}

function Metric({ label, value, unit, hero = false }: { label: string; value: number; unit: string; hero?: boolean }) {
  return <dl className={hero ? "iot-metric iot-metric-hero" : "iot-metric"}><dt>{label}</dt><dd><NumberFlow value={value} locales="id-ID" format={{ maximumFractionDigits: 1 }} /><span>{unit}</span></dd></dl>
}

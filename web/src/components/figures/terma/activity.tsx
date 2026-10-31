"use client"

import { useId } from "react"
import { DEVICE_ANCHORS, DEVICE_SURFACES } from "./generated-view"
import { packetPath } from "./instrument-motion"

export function InstrumentActivity() {
  const id = useId().replaceAll(":", "")
  const band = DEVICE_SURFACES.band, rfid = DEVICE_SURFACES.rfid, station = DEVICE_SURFACES.station
  return <g className="iot-activity" aria-hidden="true">
    <defs><clipPath id={`${id}-band`}><rect width={band.width} height={band.height} rx="1" /></clipPath><clipPath id={`${id}-rfid`}><rect width={rfid.width} height={rfid.height} rx="1" /></clipPath></defs>
    <g className="iot-data-links">{(["station", "water", "band"] as const).map(device => <g key={device}><path className="iot-data-route" d={packetPath(DEVICE_ANCHORS[device], DEVICE_ANCHORS.gateway)} />{(device === "station" ? [0, 1 / 3, 2 / 3] : [device === "water" ? .2 : .45]).map(offset => <circle key={offset} data-packet={device} data-offset={offset} r="3.2" cx={DEVICE_ANCHORS[device][0]} cy={DEVICE_ANCHORS[device][1]} />)}</g>)}</g>
    <g transform={rfid.transform} clipPath={`url(#${id}-rfid)`}><rect data-rfid-scan width={rfid.width} height="2.8" rx=".8" y="0" /><rect data-rfid-flash width={rfid.width} height={rfid.height} rx="1" opacity="0" /></g>
    <g transform={station.transform}><rect className="iot-lcd-rail" x="2" y="2" width="19" height="4" rx=".6" /><rect data-station-bar x="2" y="2" width="10" height="4" rx=".6" /></g>
    <g transform={band.transform} clipPath={`url(#${id}-band)`}><path data-ecg data-width={band.width} data-height={band.height} className="iot-ecg-screen" /></g>
    <circle data-heartbeat-halo className="iot-heartbeat-halo" cx={DEVICE_ANCHORS.band[0]} cy={DEVICE_ANCHORS.band[1]} r="8" />
    <circle data-gateway-receive className="iot-gateway-receive" cx={DEVICE_ANCHORS.gateway[0]} cy={DEVICE_ANCHORS.gateway[1]} r="6" />
  </g>
}

export function BandSignal({ large = false }: { large?: boolean }) {
  const width = large ? 220 : 68, height = large ? 48 : 24
  return <svg className={`iot-band-signal${large ? " iot-band-signal-large" : ""}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true"><path data-ecg data-width={width} data-height={height} /></svg>
}


export type DeviceSelection = "all" | "station" | "water" | "band" | "gateway"
export const RFID_CYCLE_SECONDS = 12
export const RFID_SCAN_SECONDS = 2
export const TELEMETRY_ADAPTER = "LOCAL" as const
const base: Record<string, number> = { COR_B: 28.1, BEK_A: 27.3, GUDANG: 25.4 }
const round = (value: number) => Math.round(value * 10) / 10

/** Animation values for the device workbench drawing only; real readings come from terma-iot (lib/iot.ts). */
export function stationValue(zone: string, hour: number, seconds = 0) {
  return round((base[zone] ?? base.GUDANG) + Math.sin((hour - 8) / 8 * Math.PI) * 1.8 + Math.sin(seconds / 21) * .15)
}

export function telemetryFrame(seconds: number, zone = "COR_B", hour = 12, taps = 0) {
  const sequence = Math.floor(seconds / 5)
  const visits = Math.floor((seconds + RFID_CYCLE_SECONDS - RFID_SCAN_SECONDS) / RFID_CYCLE_SECONDS) + taps
  return {
    adapter: TELEMETRY_ADAPTER, sequence, visits,
    wbgt: stationValue(zone, hour, seconds),
    air: round(stationValue(zone, hour, seconds) + 4.3),
    humidity: Math.round(64 + Math.sin(seconds / 35) * 3),
    heartRate: Math.round(82 + Math.sin(seconds / 14) * 6),
    skinTemperature: round(34.4 + Math.sin(seconds / 28) * .2),
    battery: 87, packets: (sequence + 1) * 5 + visits,
  }
}

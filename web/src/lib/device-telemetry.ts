import { JAM_SHIFT, ZONA } from "./config"
import type { PengukuranWBGT } from "./types"

export type DeviceSelection = "all" | "station" | "water" | "band" | "gateway"
export const RFID_CYCLE_SECONDS = 12
export const RFID_SCAN_SECONDS = 2
export const TELEMETRY_ADAPTER = "LOCAL" as const
const base: Record<string, number> = { COR_B: 28.1, BEK_A: 27.3, GUDANG: 25.4 }
const round = (value: number) => Math.round(value * 10) / 10

/** Deterministic local adapter. Replace this boundary with the hardware transport later. */
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

/** A complete recorded series for planning; never label generated readings as actual measurements. */
export function stationReadings(date: string): PengukuranWBGT[] {
  return ZONA.flatMap(zone => JAM_SHIFT.map(hour => ({
    zonaKode: zone.kode, tanggal: date, jamMulai: hour,
    isbb: stationValue(zone.kode, hour), idAlat: `TST-${zone.kode}`,
    pencatat: "TERMA Station", kalibrasi: "Profil perangkat v1",
    origin: "REPLAY" as const,
    waktuCatat: `${date}T${String(hour).padStart(2, "0")}:00:00+07:00`,
  })))
}

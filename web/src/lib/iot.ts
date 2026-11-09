import { JAM_SHIFT } from "./config"
import { currentShift, managementOf } from "./management-state"
import { bandWornWithConsent, mergePersonalTelemetry, type PersonalDeviceEvent } from "./personal-telemetry"
import { recompute } from "./store-plans"
import { notice } from "./store-utils"
import type { AppState } from "./store-state"
import { placementOf } from "./station-placement"
import { isRayaWaterDemo } from "./drink-monitor"
import type { PengukuranWBGT } from "./types"

/** Device posts as validated and stamped by terma-iot (Raya46/terma-iot reading.go). */
export type IotReading =
  | { type: "station"; deviceId: string; zone: string; airC: number; humidityPct: number; wetBulbC: number | null }
  | { type: "water"; deviceId: string; uid: string }
  | { type: "water_heartbeat"; deviceId: string; uptimeMs: number }
  | { type: "band"; deviceId: string; heartRate: number | null; skinC: number | null; spo2: number | null; battery: number | null }
export type IotEvent = IotReading & { seq: number; receivedAt: string }

export const CARD_UID = /^([0-9A-F]{2}:){3,9}[0-9A-F]{2}$/

/** Stull (2011) psychrometric wet bulb from air temperature and RH; fallback when the wick sensor is absent. */
export function stullWetBulb(t: number, rh: number) {
  return t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(t + rh) - Math.atan(rh - 1.676331) + 0.00391838 * rh ** 1.5 * Math.atan(0.023101 * rh) - 4.686035
}

/**
 * ISBB without a black-globe sensor. Outdoors ISBB = 0.7·Tnwb + 0.2·Tg + 0.1·Ta; with Tg = Ta + Δ that is
 * 0.7·Tnwb + 0.3·Ta + 0.2·Δ, where Δ (globe minus air, °C) is set per Station placement: 0 in shade.
 */
export function stationWbgt(reading: Extract<IotReading, { type: "station" }>, globeDelta = 0) {
  const wick = reading.wetBulbC !== null && reading.wetBulbC <= reading.airC + 1 ? reading.wetBulbC : null
  const wetBulb = wick ?? stullWetBulb(reading.airC, reading.humidityPct)
  return { isbb: Math.round((0.7 * wetBulb + 0.3 * reading.airC + 0.2 * globeDelta) * 10) / 10, wick: wick !== null }
}

const jakarta = (iso: string) => {
  const date = new Date(iso)
  return { tanggal: date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }), jam: Number(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" })) }
}

/** A valid hour needs at least this many of its twelve 5-minute slots. */
export const MIN_HOUR_SLOTS = 8
const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * Station readings become one ISBB per zone and hour: the mean of 5-minute slot means, valid once
 * at least 8 of 12 slots are filled; the hour's maximum is kept for reports. Each row remembers the
 * last event it counted, so replayed events are never counted twice.
 */
function stationRows(s: AppState, events: IotEvent[]) {
  let bacaan = s.bacaan, changed = false
  for (const event of events) {
    if (event.type !== "station") continue
    const { tanggal, jam } = jakarta(event.receivedAt)
    if (tanggal !== s.tanggal || !JAM_SHIFT.includes(jam)) continue
    const placement = placementOf(s, event.deviceId)
    const delta = placement?.selisihGlobe ?? 0
    const { isbb, wick } = stationWbgt(event, delta)
    const zone = placement?.zonaKode ?? event.zone
    const same = (row: PengukuranWBGT) => row.zonaKode === zone && row.tanggal === tanggal && row.jamMulai === jam
    const old = bacaan.find(same)
    if (old?.origin === "MANUAL") continue // a person's measurement wins
    const own = old?.idAlat === event.deviceId && old.slot ? old : undefined
    if (own?.sampelTerakhir && event.receivedAt <= own.sampelTerakhir) continue
    const slot = own?.slot ? own.slot.map(item => ({ ...item })) : Array.from({ length: 12 }, () => ({ jumlah: 0, n: 0 }))
    const index = Math.floor(new Date(event.receivedAt).getUTCMinutes() / 5)
    slot[index].jumlah += isbb
    slot[index].n += 1
    const means = slot.filter(item => item.n > 0).map(item => item.jumlah / item.n)
    const row: PengukuranWBGT = {
      zonaKode: zone, tanggal, jamMulai: jam, isbb: round1(means.reduce((sum, value) => sum + value, 0) / means.length),
      isbbMaks: round1(Math.max(...means)), slot, sampelTerakhir: event.receivedAt,
      idAlat: event.deviceId, pencatat: "TERMA Station", kalibrasi: `${wick ? "0,7·Tnw(sumbu basah)" : "0,7·Tw(Stull, DHT11)"} + 0,3·Ta${delta ? ` + 0,2·Δglobe ${String(delta).replace(".", ",")} °C` : " (teduh, tanpa globe)"}`, origin: "AKTUAL", waktuCatat: event.receivedAt,
    }
    bacaan = [...bacaan.filter(item => !same(item)), row]
    changed = true
  }
  return changed ? bacaan : null
}

function personalEvents(s: AppState, events: IotEvent[]) {
  const workers = managementOf(s).workers
  const participants = new Set(s.pekerja.map(worker => worker.kode))
  const demoWorker = isRayaWaterDemo(currentShift(s)) ? workers.find(worker => worker.kode === "RAYA001") : undefined
  const out: PersonalDeviceEvent[] = []
  const unknownCards: string[] = []
  for (const event of events) {
    const base = { deviceId: event.deviceId, observedAt: event.receivedAt, origin: "AKTUAL" as const }
    if (event.type === "water") {
      const worker = demoWorker ?? workers.find(row => row.kartuUid === event.uid)
      if (worker && participants.has(worker.kode)) out.push({ ...base, id: `${event.deviceId}:${event.receivedAt}`, type: "WATER_VISIT", pekerjaKode: worker.kode, attribution: demoWorker ? "DEMO_RAYA" : undefined })
      else unknownCards.push(event.uid)
    } else if (event.type === "water_heartbeat") {
      const coverageFrom = new Date(Date.parse(event.receivedAt) - event.uptimeMs).toISOString()
      for (const code of participants) out.push({ ...base, id: `${event.deviceId}:cov:${code}:${event.receivedAt}`, type: "WATER_COVERAGE", pekerjaKode: code, coverageFrom, online: true })
    } else if (event.type === "band" && event.heartRate !== null && event.skinC !== null) {
      const wearer = currentShift(s)?.bands?.find(row => row.bandId === event.deviceId && !row.dikembalikanPada && !row.dibatalkanPada)?.pekerjaKode
      if (wearer && participants.has(wearer) && bandWornWithConsent(s, event.deviceId, wearer, event.receivedAt)) {
        out.push({ ...base, id: `${event.deviceId}:${event.receivedAt}`, type: "BAND_READING", pekerjaKode: wearer, heartRate: event.heartRate, skinTemperature: event.skinC, quality: "VALID", batteryPercent: event.battery ?? undefined })
      }
    }
  }
  return { out, unknownCards }
}

/** Polled device events -> existing TERMA records. Silent per poll: no audit entry or toast for routine samples. */
export function ingestIot(s: AppState, events: IotEvent[]): AppState {
  let next = s
  const management = managementOf(s)
  const stations = new Map(management.latestStationEvents?.map(event => [event.deviceId, event]))
  let changed = false
  for (const event of events) if (event.type === "station") {
    const previous = stations.get(event.deviceId)
    if (!previous || Date.parse(event.receivedAt) > Date.parse(previous.receivedAt)) { stations.set(event.deviceId, event); changed = true }
  }
  if (changed) next = { ...next, management: { ...management, latestStationEvents: [...stations.values()] } }
  const shift = currentShift(next)
  if (!shift || shift.status === "CLOSED" || !events.length) return next
  const bacaan = stationRows(next, events)
  if (bacaan) next = recompute({ ...next, bacaan })
  const { out, unknownCards } = personalEvents(next, events)
  const sameDay = out.filter(event => jakarta(event.observedAt).tanggal === shift.tanggal)
  if (sameDay.length) {
    const merged = mergePersonalTelemetry(next, sameDay)
    // Band and Water readings can raise plan warnings: recompute so changes become a new version for HSE approval.
    if ("state" in merged) next = recompute(merged.state)
  }
  return unknownCards.length ? notice(next, "info", `Kartu ${unknownCards.at(-1)} belum terdaftar pada peserta shift. Isi "UID kartu" di data pekerja.`) : next
}

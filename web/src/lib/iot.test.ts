import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, readDemoState, rencanaAktif } from "./store"
import { currentBandAllocations } from "./band-management"
import { hariIni } from "./config"
import { currentShift } from "./management-state"
import { stationWbgt, stullWetBulb, type IotEvent, type IotReading } from "./iot"
import type { Action, AppState } from "./store-state"

const run = (s: AppState, ...a: Action[]) => a.reduce(reducer, s)
const worker = (kode: string, kartuUid?: string): Action => ({ type: "SIMPAN_PEKERJA", input: { kode, nama: kode, reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar", kartuUid } })
function shift(date: string) {
  return run(emptyWorkspaceState(date), worker("W01", "A1:B2:C3:D4"), worker("W02"), { type: "BUAT_SHIFT", tanggal: date, nama: "Shift IoT", workerCodes: ["W01", "W02"] })
}
let seq = 0
const event = (reading: IotReading, receivedAt: string): IotEvent => ({ ...reading, seq: ++seq, receivedAt: new Date(receivedAt).toISOString() })
const iot = (s: AppState, ...events: IotEvent[]) => reducer(s, { type: "TERIMA_IOT", events })

describe("low-budget TERMA devices", () => {
  it("estimates ISBB without a black globe and rejects a soaked (non-evaporating) wick", () => {
    expect(stullWetBulb(20, 50)).toBeCloseTo(13.7, 1) // Stull (2011) worked example
    expect(stationWbgt({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 26 })).toEqual({ isbb: 27.8, wick: true })
    expect(stationWbgt({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 34 }).wick).toBe(false)
  })

  it("records Station readings as AKTUAL hourly ISBB, keeping the hour's maximum and manual entries", () => {
    const date = "2026-11-06"
    const station = (wetBulbC: number, at: string) => event({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC }, at)
    let s = iot(shift(date), station(26, `${date}T10:05:00+07:00`), station(25, `${date}T10:40:00+07:00`), station(26, `${date}T20:00:00+07:00`))
    expect(s.bacaan.filter(row => row.idAlat === "TST-01")).toEqual([expect.objectContaining({ zonaKode: "COR_B", jamMulai: 10, isbb: 27.8, origin: "AKTUAL" })])
    s = run(s, { type: "LOGIN", userId: "hse-ratna" }, { type: "INPUT_BACAAN", zonaKode: "COR_B", jamMulai: 11, isbb: 29, idAlat: "QUEST", kalibrasi: "C-1" })
    s = iot(s, station(28, `${date}T11:10:00+07:00`))
    expect(s.bacaan.find(row => row.zonaKode === "COR_B" && row.jamMulai === 11)?.origin).toBe("MANUAL")
  })

  it("maps Water Station card taps and heartbeats to shift participants", () => {
    const date = "2026-11-06"
    let s = iot(shift(date), event({ type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 600000 }, `${date}T09:00:00+07:00`), event({ type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4" }, `${date}T09:05:00+07:00`))
    const telemetry = currentShift(s)?.personalTelemetry ?? []
    expect(telemetry.filter(row => row.type === "WATER_COVERAGE")).toHaveLength(2)
    expect(telemetry.filter(row => row.type === "WATER_VISIT")).toEqual([expect.objectContaining({ pekerjaKode: "W01" })])
    s = iot(s, event({ type: "water", deviceId: "TWS-01", uid: "DE:AD:BE:EF" }, `${date}T09:06:00+07:00`))
    expect(s.notice?.pesan).toContain("DE:AD:BE:EF")
    expect(readDemoState(JSON.stringify(s)).pekerja.length).toBeGreaterThan(0)
  })

  it("attributes Band readings only to the consented wearer after handoff", () => {
    const date = hariIni()
    const band = () => event({ type: "band", deviceId: "BAND-01", heartRate: 96, skinC: 34.6, spo2: 98, battery: null }, new Date(Date.now() + 1000).toISOString())
    let s = run(shift(date), { type: "LOGIN", userId: "klinik-dewi" }, { type: "PERSETUJUAN_MEDIS", pekerjaKode: "W01", jenis: "BAND", aktif: true }, { type: "LOGIN", userId: "hse-ratna" }, { type: "ATUR_BAND", bandId: "BAND-01", pekerjaKode: "W01" })
    expect(currentShift(iot(s, band()))?.personalTelemetry ?? []).toHaveLength(0) // assigned, not yet worn
    for (const plan of rencanaAktif(s)) s = reducer(s, { type: "SETUJUI", rencanaId: plan.id })
    s = run(s, { type: "TERBITKAN_SHIFT", shiftId: date }, { type: "LOGIN", userId: "mandor-budi" }, { type: "SERAH_BAND", allocationId: currentBandAllocations(s)[0].id })
    s = iot(s, band())
    expect(currentShift(s)?.personalTelemetry).toEqual([expect.objectContaining({ type: "BAND_READING", pekerjaKode: "W01", heartRate: 96, skinTemperature: 34.6, origin: "AKTUAL" })])
  })
})

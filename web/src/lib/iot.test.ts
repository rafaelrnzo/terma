import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, readDemoState, rencanaAktif } from "./store"
import { currentBandAllocations } from "./band-management"
import { hariIni } from "./config"
import { USERS } from "./config"
import { bodyMonitoring } from "./body-monitoring"
import { rayaDemoWorkspace } from "./raya-demo"
import { currentShift } from "./management-state"
import { kualitasBacaan } from "./rules"
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
  it("maps every card to Raya only in the single-worker Raya demo and keeps an idempotent visit log", () => {
    const date = "2026-11-06"
    const taps = [event({ type: "water", deviceId: "TWS-01", uid: "11:22:33:44" }, `${date}T09:00:00+07:00`), event({ type: "water", deviceId: "TWS-01", uid: "55:66:77:88" }, `${date}T09:01:00+07:00`)]
    let s = iot(rayaDemoWorkspace(date), ...taps)
    expect(currentShift(s)?.personalTelemetry?.filter(row => row.type === "WATER_VISIT")).toEqual(taps.map(() => expect.objectContaining({ pekerjaKode: "RAYA001", origin: "AKTUAL", attribution: "DEMO_RAYA" })))
    s = iot(s, ...taps)
    expect(currentShift(s)?.personalTelemetry).toHaveLength(2)
    s = run(s, worker("W02"), { type: "UBAH_SHIFT", shiftId: date, nama: "Multi-worker", workerCodes: ["RAYA001", "W02"] })
    s = iot(s, event({ type: "water", deviceId: "TWS-01", uid: "AA:BB:CC:DD" }, `${date}T09:02:00+07:00`))
    expect(currentShift(s)?.personalTelemetry?.filter(row => row.type === "WATER_VISIT")).toHaveLength(2)
    expect(s.notice?.pesan).toContain("belum terdaftar")
  })
  it("keeps live Station readings outside work hours for the assigned worker zone", () => {
    const date = "2026-11-06"
    let s = run(shift(date), { type: "SIMPAN_PENEMPATAN_STATION", deviceId: "TST-01", zonaKode: "GUDANG", lat: -6.17, lng: 106.82 })
    const reading = event({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 26 }, `${date}T03:00:00+07:00`)
    s = iot(s, reading)
    expect(s.bacaan).toHaveLength(0)
    expect(readDemoState(JSON.stringify(s)).management?.latestStationEvents).toEqual([reading])
    const admin = USERS.find(user => user.role === "ADMIN")!
    const heat = bodyMonitoring(s, admin, "W01", date, Date.parse(`${date}T03:01:00+07:00`))!.signals.find(signal => signal.key === "heat")!
    expect(heat.source).toContain("AKTUAL · TST-01 · GUDANG")
    expect(heat.metrics?.[0]).toMatchObject({ label: "WBGT Station", value: "27,8" })
    const placements = s.management!.stationPlacements
    s.management!.stationPlacements = []
    expect(bodyMonitoring(s, admin, "W01", date, Date.parse(`${date}T03:01:00+07:00`))!.signals.find(signal => signal.key === "heat")!.source).not.toContain("AKTUAL")
    s.management!.stationPlacements = placements
    expect(bodyMonitoring(s, admin, "W01", date, Date.parse(`${date}T03:05:00+07:00`))!.signals.find(signal => signal.key === "heat")!.tone).toBe("unknown")
    const historical = JSON.stringify(currentShift(s)!.workspace)
    currentShift(s)!.status = "CLOSED"
    s = iot(s, event({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 34, humidityPct: 60, wetBulbC: 28 }, `${date}T03:06:00+07:00`))
    expect(JSON.stringify(currentShift(s)!.workspace)).toBe(historical)
  })
  it("estimates ISBB without a black globe and rejects a soaked (non-evaporating) wick", () => {
    expect(stullWetBulb(20, 50)).toBeCloseTo(13.7, 1) // Stull (2011) worked example
    expect(stationWbgt({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 26 })).toEqual({ isbb: 27.8, wick: true })
    expect(stationWbgt({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 34 }).wick).toBe(false)
    // Open zone: 0.2 × (globe − air) on top; 10 °C hotter globe adds 2 °C.
    expect(stationWbgt({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 26 }, 10).isbb).toBe(29.8)
  })

  it("averages 5-minute slots into an hourly ISBB that counts only with 8 of 12 slots, keeping manual entries", () => {
    const date = "2026-11-06"
    const station = (wetBulbC: number, at: string) => event({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC }, at)
    // 10:00 slot: two samples (27.8 and 27.1 → 27.45); 10:05 slot: 27.8. Hour mean = (27.45 + 27.8) / 2.
    const first = [station(26, `${date}T10:00:10+07:00`), station(25, `${date}T10:00:40+07:00`), station(26, `${date}T10:05:00+07:00`), station(26, `${date}T20:00:00+07:00`)]
    let s = iot(shift(date), ...first)
    const hour = () => s.bacaan.find(row => row.idAlat === "TST-01" && row.jamMulai === 10)!
    expect(hour()).toMatchObject({ zonaKode: "COR_B", isbb: 27.6, isbbMaks: 27.8, origin: "AKTUAL" })
    expect(s.bacaan.filter(row => row.idAlat === "TST-01")).toHaveLength(1)
    expect(kualitasBacaan("COR_B", date, 10, s.bacaan, []).kualitas).toBe("TIDAK_TERSEDIA") // 2 of 12 slots: not yet a measurement
    s = iot(s, ...first) // replayed after a restart: nothing counted twice
    expect(hour().slot?.reduce((sum, item) => sum + item.n, 0)).toBe(3)
    s = iot(s, ...[10, 15, 20, 25, 30, 35].map(minute => station(26, `${date}T10:${minute}:00+07:00`)))
    expect(kualitasBacaan("COR_B", date, 10, s.bacaan, []).kualitas).toBe("TERUKUR")
    s = run(s, { type: "LOGIN", userId: "hse-ratna" }, { type: "INPUT_BACAAN", zonaKode: "COR_B", jamMulai: 11, isbb: 29, idAlat: "QUEST", kalibrasi: "C-1" })
    s = iot(s, station(28, `${date}T11:10:00+07:00`))
    expect(s.bacaan.find(row => row.zonaKode === "COR_B" && row.jamMulai === 11)?.origin).toBe("MANUAL")
  })

  it("files Station readings under the zone where the Station is placed", () => {
    const date = "2026-11-06"
    let s = run(shift(date), { type: "LOGIN", userId: "mandor-budi" }, { type: "SIMPAN_PENEMPATAN_STATION", deviceId: "TST-01", zonaKode: "BEK_A", lat: -6.2, lng: 106.8 })
    expect(s.notice?.tipe).toBe("error")
    s = run(s, { type: "LOGIN", userId: "hse-ratna" }, { type: "SIMPAN_PENEMPATAN_STATION", deviceId: "tst-01", zonaKode: "BEK_A", lat: -6.2, lng: 106.8 })
    expect(readDemoState(JSON.stringify(s)).management?.stationPlacements).toEqual([expect.objectContaining({ deviceId: "TST-01", zonaKode: "BEK_A" })])
    s = iot(s, event({ type: "station", deviceId: "TST-01", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 26 }, `${date}T10:05:00+07:00`))
    expect(s.bacaan.filter(row => row.idAlat === "TST-01").map(row => row.zonaKode)).toEqual(["BEK_A"])
    expect(reducer(s, { type: "SIMPAN_PENEMPATAN_STATION", deviceId: "TST-01", zonaKode: "BEK_A", lat: 200, lng: 0 }).notice?.tipe).toBe("error")
  })

  it("adds a Station at a new map location without selecting a work zone", () => {
    const date = "2026-11-06"
    let s = run(shift(date), { type: "LOGIN", userId: "hse-ratna" }, { type: "SIMPAN_PENEMPATAN_STATION", deviceId: "TST-02", namaLokasi: "Area produksi utara", lat: -6.176123, lng: 106.827456 })
    expect(s.notice?.tipe).toBe("ok")
    expect(readDemoState(JSON.stringify(s)).management?.stationPlacements).toEqual([expect.objectContaining({ deviceId: "TST-02", namaLokasi: "Area produksi utara", lat: -6.176123, lng: 106.827456 })])
    s = iot(s, event({ type: "station", deviceId: "TST-02", zone: "COR_B", airC: 32, humidityPct: 60, wetBulbC: 26 }, `${date}T10:05:00+07:00`))
    expect(s.bacaan.find(row => row.idAlat === "TST-02")?.zonaKode).toBe("COR_B")
    expect(reducer(s, { type: "SIMPAN_PENEMPATAN_STATION", deviceId: "TST-03", namaLokasi: " ", lat: -6.17, lng: 106.82 }).notice?.tipe).toBe("error")
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

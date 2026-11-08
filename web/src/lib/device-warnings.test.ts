import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, rencanaAktif } from "./store"
import { currentBandAllocations } from "./band-management"
import { hariIni } from "./config"
import { deviceWarnings } from "./device-warnings"
import { managementOf } from "./management-state"
import type { IotEvent, IotReading } from "./iot"
import type { PersonalDeviceEvent } from "./personal-telemetry"
import type { Action, AppState } from "./store-state"

const run = (s: AppState, ...a: Action[]) => a.reduce(reducer, s)
const worker = (kode: string, kartuUid?: string): Action => ({ type: "SIMPAN_PEKERJA", input: { kode, nama: kode, reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar", kartuUid } })
const planOf = (s: AppState, code: string) => rencanaAktif(s).find(plan => plan.pekerjaKode === code)!

/** Active shift today with W01 wearing BAND-01 since two hours ago, plans approved. */
function wearing() {
  const date = hariIni()
  let s = run(emptyWorkspaceState(date), worker("W01"), { type: "BUAT_SHIFT", tanggal: date, nama: "Shift", workerCodes: ["W01"] },
    { type: "LOGIN", userId: "klinik-dewi" }, { type: "PERSETUJUAN_MEDIS", pekerjaKode: "W01", jenis: "BAND", aktif: true },
    { type: "LOGIN", userId: "hse-ratna" }, { type: "ATUR_BAND", bandId: "BAND-01", pekerjaKode: "W01" })
  for (const plan of rencanaAktif(s)) s = reducer(s, { type: "SETUJUI", rencanaId: plan.id })
  s = run(s, { type: "TERBITKAN_SHIFT", shiftId: date }, { type: "LOGIN", userId: "mandor-budi" }, { type: "SERAH_BAND", allocationId: currentBandAllocations(s)[0].id }, { type: "LOGIN", userId: "hse-ratna" })
  // ponytail: backdate the handoff so an hour of readings fits before "now"
  const m = managementOf(s)
  const since = new Date(Date.now() - 2 * 3600_000).toISOString()
  return { ...s, management: { ...m, shifts: m.shifts.map(shift => ({ ...shift, bands: shift.bands?.map(row => ({ ...row, dipakaiPada: since })) })) } }
}
function heartRateFor(minutes: number, heartRate: number): PersonalDeviceEvent[] {
  const end = Date.now() - 60_000
  return Array.from({ length: minutes }, (_, i) => ({ id: `b${heartRate}-${i}`, type: "BAND_READING" as const, pekerjaKode: "W01", deviceId: "BAND-01", observedAt: new Date(end - (minutes - 1 - i) * 60_000).toISOString(), origin: "AKTUAL" as const, heartRate, skinTemperature: 34.5, quality: "VALID" as const }))
}

describe("device warnings revise the work-rest plan", () => {
  it("turns a sustained high Band core estimate into a red plan version that needs HSE approval", () => {
    const s = reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(60, 150) })
    expect(deviceWarnings(s, "W01", true).band).toBe("MERAH")
    const plan = planOf(s, "W01")
    expect(plan.riskColour).toBe("MERAH")
    expect(plan.version).toBe(2)
    expect(plan.disetujuiOleh).toBeUndefined()
    expect(plan.alasan.join(" ")).toContain("estimasi suhu inti")
  })

  it("flags waspada below the threshold and stays quiet at rest", () => {
    expect(deviceWarnings(reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(60, 130) }), "W01", true).band).toBe("WASPADA")
    const rest = reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(60, 100) })
    expect(deviceWarnings(rest, "W01", true).band).toBeUndefined()
    expect(planOf(rest, "W01").version).toBe(1)
  })

  it("marks a drink gap only while the Water Station reports, and clears it after a tap", () => {
    const date = "2026-11-06"
    let seq = 0
    const at = (reading: IotReading, time: string): IotEvent => ({ ...reading, seq: ++seq, receivedAt: new Date(`${date}T${time}:00+07:00`).toISOString() })
    let s = run(emptyWorkspaceState(date), worker("W01", "A1:B2:C3:D4"), { type: "BUAT_SHIFT", tanggal: date, nama: "Shift", workerCodes: ["W01"] })
    expect(deviceWarnings(s, "W01", true).drinkGapMinutes).toBeUndefined()
    s = reducer(s, { type: "TERIMA_IOT", events: [at({ type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4" }, "08:05"), at({ type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 3_600_000 }, "09:00")] })
    expect(deviceWarnings(s, "W01", true).drinkGapMinutes).toBe(55)
    expect(planOf(s, "W01").riskColour).not.toBe("HIJAU")
    s = reducer(s, { type: "TERIMA_IOT", events: [at({ type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4" }, "09:01"), at({ type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 3_720_000 }, "09:02")] })
    expect(deviceWarnings(s, "W01", true).drinkGapMinutes).toBeUndefined()
  })
})

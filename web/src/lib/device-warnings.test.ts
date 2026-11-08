import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, rencanaAktif } from "./store"
import { currentBandAllocations } from "./band-management"
import { hariIni } from "./config"
import { deviceWarnings } from "./device-warnings"
import { shiftAlerts } from "./shift-alerts"
import { USERS } from "./config"
import { currentShift, managementOf } from "./management-state"
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

  it("treats heart rate held at 180 − age for five minutes as red, using the consented clinic age", () => {
    const withAge = run(wearing(), { type: "LOGIN", userId: "klinik-dewi" }, { type: "PERSETUJUAN_MEDIS", pekerjaKode: "W01", jenis: "MCU", aktif: true },
      { type: "SIMPAN_PROFIL_MEDIS", input: { pekerjaKode: "W01", tanggalLahir: `${Number(hariIni().slice(0, 4)) - 41}-01-01`, hipertensi: false, diabetes: false, jantung: false, riwayatPanas: false, obatBerisiko: false, catatan: "" } },
      { type: "LOGIN", userId: "hse-ratna" })
    expect(deviceWarnings(reducer(withAge, { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(6, 150) }), "W01", true).band).toBe("MERAH") // limit 180 − 41 = 139
    expect(deviceWarnings(reducer(withAge, { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(6, 130) }), "W01", true).band).toBeUndefined()
    expect(deviceWarnings(reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(6, 150) }), "W01", true).band).toBeUndefined() // no consented age: not assessed
  })

  it("flags waspada below the threshold and stays quiet at rest", () => {
    expect(deviceWarnings(reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(60, 130) }), "W01", true).band).toBe("WASPADA")
    const rest = reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(60, 100) })
    expect(deviceWarnings(rest, "W01", true).band).toBeUndefined()
    expect(planOf(rest, "W01").version).toBe(1)
  })

  it("marks a drink deficit only while the Water Station reports, with one tap of tolerance", () => {
    const date = "2026-11-06"
    let seq = 0
    const at = (reading: IotReading, time: string): IotEvent => ({ ...reading, seq: ++seq, receivedAt: new Date(`${date}T${time}:00+07:00`).toISOString() })
    let s = run(emptyWorkspaceState(date), worker("W01", "A1:B2:C3:D4"), { type: "BUAT_SHIFT", tanggal: date, nama: "Shift", workerCodes: ["W01"] })
    expect(deviceWarnings(s, "W01", true).drink).toBeUndefined()
    // Station online since 08:00, checked at 10:00 → target 4 visits (30-minute interval); 1 visit is behind.
    s = reducer(s, { type: "TERIMA_IOT", events: [at({ type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4" }, "08:05"), at({ type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 7_200_000 }, "10:00")] })
    expect(deviceWarnings(s, "W01", true).drink).toEqual({ visits: 1, target: 4 })
    expect(planOf(s, "W01").riskColour).not.toBe("HIJAU")
    s = reducer(s, { type: "TERIMA_IOT", events: [at({ type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4" }, "09:00"), at({ type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4" }, "09:40"), at({ type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 7_260_000 }, "10:01")] })
    expect(deviceWarnings(s, "W01", true).drink).toBeUndefined()
  })
})

describe("drink deficit carries over", () => {
  it("adds +1 to the next shift's score when the previous shift ended with a deficit above 25%", () => {
    const day1 = "2026-11-05", day2 = "2026-11-06"
    let s = run(emptyWorkspaceState(day1), worker("W01", "A1:B2:C3:D4"), { type: "BUAT_SHIFT", tanggal: day1, nama: "Shift 1", workerCodes: ["W01"] })
    // Station online all shift (08:00–16:00), one visit against a target of 16.
    s = reducer(s, { type: "TERIMA_IOT", events: [
      { type: "water", deviceId: "TWS-01", uid: "A1:B2:C3:D4", seq: 1, receivedAt: new Date(`${day1}T08:30:00+07:00`).toISOString() },
      { type: "water_heartbeat", deviceId: "TWS-01", uptimeMs: 8 * 3_600_000, seq: 2, receivedAt: new Date(`${day1}T16:00:00+07:00`).toISOString() },
    ] })
    s = run(s, { type: "LOGIN", userId: "hse-ratna" }, { type: "BUAT_SHIFT", tanggal: day2, nama: "Shift 2", workerCodes: ["W01"] })
    expect(planOf(s, "W01").alasan.join(" ")).toContain("Defisit minum shift sebelumnya 94% (+1)")
  })
})

describe("foreman alerts", () => {
  const budi = USERS.find(user => user.id === "mandor-budi")!, sari = USERS.find(user => user.id === "mandor-sari")!
  it("raises a red Band alert for the crew's foreman only, and clears it once handled", () => {
    let s = reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(60, 150) })
    const alert = shiftAlerts(s, budi).find(row => row.kind === "BAND_MERAH")!
    expect(alert).toMatchObject({ pekerjaKode: "W01", level: "MERAH" })
    expect(shiftAlerts(s, sari)).toEqual([])
    const handle = { type: "TANGANI_PERINGATAN" as const, key: alert.key, pekerjaKode: "W01", kind: alert.kind, tindakan: "ISTIRAHAT" as const }
    expect(run(s, { type: "LOGIN", userId: sari.id }, handle).notice?.tipe).toBe("error")
    s = run(s, { type: "LOGIN", userId: budi.id }, handle)
    expect(shiftAlerts(s, budi).some(row => row.kind === "BAND_MERAH")).toBe(false)
    expect(currentShift(s)?.alertActions?.[0]).toMatchObject({ tindakan: "ISTIRAHAT", oleh: "Budi" })
  })

  it("asks the foreman to check a worn Band that has been silent for over five minutes", () => {
    expect(shiftAlerts(wearing(), budi).map(row => row.kind)).toContain("BAND_SENYAP")
    const fresh = reducer(wearing(), { type: "TERIMA_TELEMETRI_PEKERJA", events: heartRateFor(3, 90) })
    expect(shiftAlerts(fresh, budi).map(row => row.kind)).not.toContain("BAND_SENYAP")
  })
})

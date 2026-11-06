import { describe, expect, it } from "vitest"
import { BMKG_SITE, parseBmkgForecast, forecastPeriodLabel } from "./bmkg"
import { emptyWorkspaceState, reducer } from "./store"
import { currentShift } from "./management-state"

function payload() {
  return { lokasi: { adm4: BMKG_SITE.code, desa: "Kemayoran", kotkab: "Kota Adm. Jakarta Pusat", lat: -6.1647, lon: 106.8453, timezone: "Asia/Jakarta" }, data: [{ cuaca: [[{ local_datetime: "2026-11-06 23:00:00", t: 28, hu: 77, weather_desc: "Cerah Berawan", analysis_date: "2026-11-06T00:00:00" }]] }] }
}
function draft() {
  let state = reducer(emptyWorkspaceState("2026-11-06"), { type: "SIMPAN_PEKERJA", input: { kode: "W01", nama: "Andi", reguKode: "COR", tanggalMulai: "2026-11-06", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
  state = reducer(state, { type: "BUAT_SHIFT", tanggal: "2026-11-06", nama: "Shift cuaca", workerCodes: ["W01"] })
  return state
}

describe("public BMKG contract", () => {
  it("preserves local start time, the three-hour interval and UTC production time", () => {
    const data = parseBmkgForecast(payload())
    expect(data.records[0]).toMatchObject({ tanggal: "2026-11-06", jamMulai: 23, intervalJam: 3, suhu: 28, kelembapan: 77, waktuProduksi: "2026-11-06T00:00:00.000Z", sumber: "BMKG" })
    expect(forecastPeriodLabel(data.records[0])).toBe("23.00–02.00 (+1 hari)")
  })
  it("rejects missing data, another location, invalid days and impossible humidity", () => {
    expect(() => parseBmkgForecast({})).toThrow()
    const wrong = payload(); wrong.lokasi.adm4 = "00.00.00.0000"
    expect(() => parseBmkgForecast(wrong)).toThrow("Lokasi")
    const invalidDate = payload(); invalidDate.data[0].cuaca[0][0].local_datetime = "2026-02-31 08:00:00"
    expect(() => parseBmkgForecast(invalidDate)).toThrow("Waktu")
    const invalidHumidity = payload(); invalidHumidity.data[0].cuaca[0][0].hu = 150
    expect(() => parseBmkgForecast(invalidHumidity)).toThrow("Kelembapan")
    expect(() => parseBmkgForecast({ ...payload(), data: [] })).toThrow("belum menyediakan")
  })
  it("syncs draft inputs without changing the original API interval", () => {
    const data = parseBmkgForecast(payload())
    const state = reducer(draft(), { type: "CUACA_DITERIMA", data })
    expect(state.prakiraan).toEqual(data.records)
    expect(currentShift(state)?.workspace.prakiraan).toEqual(data.records)
  })
  it("retains closed snapshots and the last successful weather on failure", () => {
    let state = reducer(draft(), { type: "CUACA_DITERIMA", data: parseBmkgForecast(payload()) })
    if (!state.management) throw new Error("Expected management")
    state = { ...state, management: { ...state.management, shifts: state.management.shifts.map(shift => ({ ...shift, status: "CLOSED" })) } }
    const snapshot = currentShift(state)
    const changed = payload(); changed.data[0].cuaca[0][0].t = 30
    state = reducer(state, { type: "CUACA_DITERIMA", data: parseBmkgForecast(changed) })
    expect(currentShift(state)).toEqual(snapshot)
    state = reducer(state, { type: "CUACA_GAGAL", pesan: "Jaringan terputus" })
    expect(state.weather?.status).toBe("error")
    expect(state.weather?.data?.records[0].suhu).toBe(30)
    expect(state.prakiraan[0].suhu).toBe(28)
  })
  it("makes already-fetched forecasts available when creating a shift", () => {
    let state = reducer(emptyWorkspaceState("2026-11-06"), { type: "CUACA_DITERIMA", data: parseBmkgForecast(payload()) })
    state = reducer(state, { type: "SINKRON_PERUSAHAAN" })
    state = reducer(state, { type: "BUAT_SHIFT", tanggal: "2026-11-06", nama: "Shift cuaca", workerCodes: ["CMP001"] })
    expect(currentShift(state)?.workspace.prakiraan[0].sumber).toBe("BMKG")
  })
})

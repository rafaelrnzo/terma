import { describe, expect, it } from "vitest"
import { forecastAtPeriod, forecastHours } from "./forecast"
import type { PrakiraanCuaca } from "./types"

const record: PrakiraanCuaca = { tanggal: "2026-11-06", lokasi: "Lokasi perusahaan", jamMulai: 7, intervalJam: 3, suhu: 32, kelembapan: 70, waktuProduksi: "2026-11-06T05:00:00+07:00" }

describe("forecast periods", () => {
  it("preserves native intervals and leaves gaps empty", () => {
    expect(forecastAtPeriod([record], record.tanggal, 9)).toEqual(record)
    expect(forecastAtPeriod([record], record.tanggal, 10)).toBeNull()
    expect(forecastAtPeriod([record], "2026-11-07", 8)).toBeNull()
    expect(forecastHours([record], record.tanggal)).toEqual([7])
  })
  it("selects the latest published overlapping record without mutating input", () => {
    const latest = { ...record, suhu: 33, waktuProduksi: "2026-11-06T06:00:00+07:00" }
    const records = [record, latest]
    expect(forecastAtPeriod(records, record.tanggal, 8)).toEqual(latest)
    expect(records).toEqual([record, latest])
  })
})

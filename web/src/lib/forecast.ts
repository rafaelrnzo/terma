import type { PrakiraanCuaca } from "./types"

/** Keep the source interval; weather is never converted to a zone WBGT reading. */
export function forecastAtPeriod(records: PrakiraanCuaca[], date: string, hour: number) {
  return records.filter(record => record.tanggal === date && hour >= record.jamMulai && hour < record.jamMulai + record.intervalJam)
    .toSorted((a, b) => Date.parse(b.waktuProduksi) - Date.parse(a.waktuProduksi))[0] ?? null
}

export function forecastHours(records: PrakiraanCuaca[], date: string) {
  const hours = records.filter(record => record.tanggal === date).map(record => record.jamMulai)
  return hours.length ? [...new Set(hours)].toSorted((a, b) => a - b) : [6, 9, 12, 15, 18, 21]
}

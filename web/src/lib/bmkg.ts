import type { PrakiraanCuaca } from "./types"

export const BMKG_SITE = { code: "31.71.03.1001", label: "Kemayoran, Jakarta Pusat" }
export const BMKG_MAP_CENTER: [number, number] = [106.8453837867, -6.1647214778]
export const BMKG_URL = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${BMKG_SITE.code}`
export interface BmkgForecast {
  location: string
  code: string
  latitude: number
  longitude: number
  timezone: string
  fetchedAt: string
  records: PrakiraanCuaca[]
}
export type WeatherState = { status: "loading" | "ready" | "error"; data?: BmkgForecast; error?: string }
export type WeatherAction = { type: "CUACA_MULAI" } | { type: "CUACA_DITERIMA"; data: BmkgForecast } | { type: "CUACA_GAGAL"; pesan: string }

function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value) }
function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Data BMKG tidak lengkap: ${field}.`)
  return value
}
function requiredNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Nilai BMKG tidak valid: ${field}.`)
  return value
}
/** BMKG analysis_date is UTC without a suffix; local_datetime follows the supplied location. */
export function parseBmkgForecast(raw: unknown): BmkgForecast {
  if (!object(raw) || !object(raw.lokasi) || !Array.isArray(raw.data)) throw new Error("Format respons BMKG tidak dikenali.")
  const site = raw.lokasi
  const code = requiredString(site.adm4, "kode wilayah")
  if (code !== BMKG_SITE.code) throw new Error("Lokasi respons BMKG berbeda dari lokasi acuan.")
  const location = `${requiredString(site.desa, "kelurahan")}, ${requiredString(site.kotkab, "kota")}`
  const records: PrakiraanCuaca[] = []
  for (const group of raw.data) {
    if (!object(group) || !Array.isArray(group.cuaca)) throw new Error("Periode prakiraan BMKG tidak tersedia.")
    for (const day of group.cuaca) {
      if (!Array.isArray(day)) throw new Error("Format periode BMKG tidak valid.")
      for (const entry of day) {
        if (!object(entry)) throw new Error("Bacaan BMKG tidak valid.")
        const local = requiredString(entry.local_datetime, "waktu lokal")
        const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}):00:00$/.exec(local)
        const analysis = requiredString(entry.analysis_date, "waktu produksi")
        const produced = /(?:Z|[+-]\d{2}:\d{2})$/.test(analysis) ? analysis : `${analysis}Z`
        if (!match || Number(match[2]) > 23 || (!Number.isFinite(Date.parse(`${match[1]}T00:00:00Z`)) || new Date(`${match[1]}T00:00:00Z`).toISOString().slice(0, 10) !== match[1]) || !Number.isFinite(Date.parse(produced))) throw new Error("Waktu prakiraan BMKG tidak valid.")
        const humidity = requiredNumber(entry.hu, "kelembapan")
        if (humidity < 0 || humidity > 100) throw new Error("Kelembapan BMKG di luar rentang.")
        records.push({ tanggal: match[1], lokasi: location, jamMulai: Number(match[2]), intervalJam: 3, suhu: requiredNumber(entry.t, "suhu udara"), kelembapan: humidity, waktuProduksi: new Date(produced).toISOString(), kondisi: requiredString(entry.weather_desc, "kondisi cuaca"), sumber: "BMKG" })
      }
    }
  }
  if (!records.length) throw new Error("BMKG belum menyediakan prakiraan untuk lokasi ini.")
  return { location, code, latitude: requiredNumber(site.lat, "lintang"), longitude: requiredNumber(site.lon, "bujur"), timezone: requiredString(site.timezone, "zona waktu"), fetchedAt: new Date().toISOString(), records: records.toSorted((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jamMulai - b.jamMulai) }
}

export function forecastPeriodLabel(forecast: PrakiraanCuaca) {
  const end = forecast.jamMulai + forecast.intervalJam
  const clock = (hour: number) => `${String(hour % 24).padStart(2, "0")}.00`
  return `${clock(forecast.jamMulai)}–${clock(end)}${end >= 24 ? " (+1 hari)" : ""}`
}

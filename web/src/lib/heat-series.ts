import type { OverviewZone } from "./overview"

export function heatSeries(zone: OverviewZone, date: string) {
  return zone.series.map(point => ({
    date: new Date(`${date}T${String(point.hour).padStart(2, "0")}:00:00`),
    label: `${String(point.hour).padStart(2, "0")}.00`,
    value: (point.kualitas === "TERUKUR" || point.kualitas === "REPLAY") && point.reading && Number.isFinite(point.reading.isbb) ? point.reading.isbb : null,
    quality: point.kualitas,
  }))
}

export const ACCLIMATISATION_EXAMPLE = [1, 2, 3, 4, 5].map(day => ({ day: `Hari ${day}`, minutes: day * 96 }))

import type { PersonalDeviceEvent } from "./personal-telemetry"

export type BandReading = Extract<PersonalDeviceEvent, { type: "BAND_READING" }>
export interface CoreEstimate { temperature: number; variance: number }

/** Buller 2013 EKF, author's equations 3.27–3.32 and Matlab implementation.
 * gamma and sigma are variances (squared SDs). Skin temperature is not an input.
 * Reference: docs/band-paper-crosswalk.md. This is a pilot estimate, never a measured temperature.
 */
export function coreTemperatureSeries(heartRates: number[], initial = 37.1): CoreEstimate[] {
  if (!Number.isFinite(initial) || initial < 35 || initial > 40 || heartRates.some(hr => !Number.isFinite(hr) || hr < 40 || hr > 220)) return []
  let temperature = initial
  let variance = 0
  return heartRates.map(heartRate => {
    const predictedVariance = variance + 0.022 ** 2
    const derivative = -9.1428 * temperature + 384.4286
    const gain = predictedVariance * derivative / (derivative ** 2 * predictedVariance + 18.88 ** 2)
    const predictedHeartRate = -4.5714 * temperature ** 2 + 384.4286 * temperature - 7887.1
    temperature += gain * (heartRate - predictedHeartRate)
    variance = (1 - gain * derivative) * predictedVariance
    return { temperature, variance }
  })
}

/** Only the latest uninterrupted valid series, one origin/device/wearing period.
 * Missing minute, bad PPG, or abrupt >30 bpm/5 s discards earlier history.
 * 30 consecutive minutes is a local initialization guard, not clinical validation.
 */
export function bandPhysiology(readings: BandReading[]) {
  const ordered = readings.toSorted((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
  const latest = ordered.at(-1)
  if (!latest || latest.quality !== "VALID") return null
  let series: BandReading[] = []
  for (const reading of ordered) {
    if (reading.deviceId !== latest.deviceId || reading.origin !== latest.origin) { series = []; continue }
    const previous = series.at(-1)
    const elapsed = previous ? Date.parse(reading.observedAt) - Date.parse(previous.observedAt) : 0
    if (reading.quality !== "VALID" || (previous && elapsed <= 5000 && Math.abs(reading.heartRate - previous.heartRate) > 30)) { series = []; continue }
    if (previous && Math.floor(Date.parse(reading.observedAt)/60000) - Math.floor(Date.parse(previous.observedAt)/60000) > 1) series = []
    series.push(reading)
  }
  if (series.at(-1) !== latest) return null
  const minutes = new Map<number, number[]>()
  for (const reading of series) {
    const minute = Math.floor(Date.parse(reading.observedAt) / 60000)
    minutes.set(minute, [...(minutes.get(minute) ?? []), reading.heartRate])
  }
  const means = [...minutes.values()].map(values => values.reduce((sum, value) => sum + value, 0) / values.length)
  const estimates = means.length >= 30 ? coreTemperatureSeries(means) : []
  return { latest, minutes: means.length, samples: series.length, meanHeartRate: means.length ? means.reduce((sum, value) => sum + value, 0) / means.length : null, peakHeartRate: Math.max(...series.map(reading => reading.heartRate)), estimate: estimates.at(-1) ?? null, trend: estimates.map((value, index) => ({ minute: index, value: value.temperature })) }
}

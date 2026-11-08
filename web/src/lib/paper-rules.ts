import { ATURAN_FIXTURE, JAM_SHIFT, NORMAL_PAPARAN_MENIT, TUGAS as TASKS } from "./config"
import { forecastAtPeriod } from "./forecast"
import { cariBaris, deteksiKandidat, kualitasBacaan, rentangJam } from "./rules"
import type { AppState } from "./store-state"
import type { Pekerja, Rencana, RiskColour, IntervalPlan } from "./types"
import { clinicOf, medicalRiskPoints } from "./clinic"
import { currentShift, managementOf } from "./management-state"
import { DRINK_RULES, drinkDeficit } from "./drink-monitor"
import { DOSE_RULES, overtimeStreak } from "./heat-dose"
import { ACCL_RULES, greenLastShifts, heatWave, hotterZoneMove } from "./acclimatisation-triggers"
import { DEVICE_RULES, deviceWarnings } from "./device-warnings"

/** Flowchart Perhitungan TERMA §2–4. Versioned draft parameters, not clinical validation. */
export const PAPER_RULES = {
  version: "TERMA 2026.1",
  points: { acclEarly: 3, acclLate: 2, unwell: 2, closedPpe: 1 },
  redScore: 5, yellowScore: 3, redMargin: 1, yellowMargin: 2,
  forecastCalibration: { a: 0, b: 1, calibrated: false },
  ppe: { Standar: 0, "Pakaian kerja biasa": 0, "Coverall kain": 0, "Coverall SMS": 0.5, "Coverall polyolefin": 1, "Dua lapis kain": 3 } as Record<string, number>,
} as const

/** Display name of a plan's rule set; plans saved before the rename keep the same rules. */
export function ruleLabel(version: string) { return version === "flow-pdf-v0" ? PAPER_RULES.version : version }

/** Today's highest ISBB: valid Station/manual hours, or the forecast estimate before any reading exists. */
export function todayMaxIsbb(s: AppState) {
  const readings = s.bacaan.filter(row => row.tanggal === s.tanggal && (!row.slot || row.slot.filter(item => item.n > 0).length >= 8)).map(row => row.isbbMaks ?? row.isbb)
  if (readings.length) return Math.max(...readings)
  const forecast = JAM_SHIFT.map(hour => forecastAtPeriod(s.prakiraan, s.tanggal, hour)).flatMap(row => row ? [estimateForecastWbgt(row.suhu, row.kelembapan)] : []).filter((value): value is number => value !== null)
  return forecast.length ? Math.max(...forecast) : null
}

export function estimateForecastWbgt(temperature: number, humidity: number) {
  if (!Number.isFinite(temperature) || !Number.isFinite(humidity) || temperature < 10 || temperature > 50 || humidity < 0 || humidity > 100) return null
  const e = humidity / 100 * 6.105 * Math.exp(17.27 * temperature / (237.7 + temperature))
  return PAPER_RULES.forecastCalibration.a + PAPER_RULES.forecastCalibration.b * (0.567 * temperature + 0.393 * e + 3.94)
}

export function paperPersonalRisk(s: AppState, worker: Pekerja) {
  const confirmation = s.konfirmasi.find(row => row.pekerjaKode === worker.kode)
  const day = confirmation?.profil !== "NORMAL" ? confirmation?.hariAdaptasi : undefined
  const factors: string[] = []
  let points = 0
  if (day && day <= 7) { const value = day <= 3 ? PAPER_RULES.points.acclEarly : PAPER_RULES.points.acclLate; points += value; factors.push(`Aklimatisasi hari ${day} (+${value})`) }
  // Acclimatisation ends at day ≥ 5 only after three green shifts; otherwise it continues up to day 14.
  else if (day && day <= ACCL_RULES.maxDays && !greenLastShifts(s, worker.kode)) { points += ACCL_RULES.extensionPoints; factors.push(`Perpanjangan aklimatisasi hari ${day}, belum hijau 3 shift (+${ACCL_RULES.extensionPoints})`) }
  const checkin = currentShift(s)?.readiness?.checkins.find(row => row.pekerjaKode === worker.kode)
  if (checkin && checkin.kondisi !== "BAIK") { points += PAPER_RULES.points.unwell; factors.push("Ada faktor kesehatan hari ini") }
  const medical = medicalRiskPoints(s, worker.kode)
  if (medical.points) { points += medical.points; if (!factors.some(factor => factor.startsWith("Ada faktor kesehatan"))) factors.push("Ada faktor kesehatan") }
  // Yesterday's final drink deficit raises today's score (flowchart: P +1 when deficit > 0.25).
  const previous = managementOf(s).shifts.filter(row => row.tanggal < s.tanggal).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))[0]
  const yesterday = drinkDeficit(previous, worker.kode)
  if (yesterday && yesterday.deficit > DRINK_RULES.tomorrowPointDeficit) { points += 1; factors.push(`Defisit minum shift sebelumnya ${Math.round(yesterday.deficit * 100)}% (+1)`) }
  if (overtimeStreak(s, worker.kode)) { points += 1; factors.push(`Lembur ${DOSE_RULES.overtimeDays} shift berturut-turut (+1)`) }
  const devices = deviceWarnings(s, worker.kode, !day || day > 7)
  if (devices.band === "WASPADA") points += DEVICE_RULES.bandWatchPoints
  factors.push(...devices.reasons)
  return { points, factors, day, medicalAvailable: medical.available, band: devices.band, bandRed: devices.band === "MERAH", drinkGap: devices.drink !== undefined }
}

export function calculatePaperPlan(s: AppState, worker: Pekerja): Omit<Rencana, "id" | "version" | "sig" | "dibuat"> | null {
  const assignment = s.penugasan.find(row => row.pekerjaKode === worker.kode)
  if (!assignment) return null
  const task = TASKS.find(row => row.kode === assignment.tugasKode)
  if (!task) return null
  const risk = paperPersonalRisk(s, worker)
  const confirmation = s.konfirmasi.find(row => row.pekerjaKode === worker.kode)
  const candidate = deteksiKandidat(worker, s.kehadiran, s.tanggal, 8)
  const moved = hotterZoneMove(s, worker.kode, assignment.zonaKode)
  const requiresConfirmation = (!!candidate.pemicu || !!moved) && !confirmation
  const wave = heatWave(s, todayMaxIsbb(s))
  const restriction = clinicOf(s).followups.some(row => row.pekerjaKode === worker.kode && row.tanggal === s.tanggal && row.status === "BATASI")
  // Core estimate over the threshold means stop heat exposure, whatever the ISBB data says.
  const stop = restriction || risk.bandRed
  const correction = PAPER_RULES.ppe[assignment.apd]
  const unknownPpe = correction === undefined
  const percent = risk.day ? Math.min(100, risk.day * 20) : requiresConfirmation ? 0 : 100
  const dailyCap = stop || unknownPpe ? 0 : Math.round(percent / 100 * NORMAL_PAPARAN_MENIT * (wave?.firstDay ? ACCL_RULES.heatWaveCut : 1))
  const reference = ATURAN_FIXTURE.rows.find(row => row.nab[task.beban] !== undefined)?.nab[task.beban]
  const reasons = [...risk.factors]
  reasons.push("Skor menggunakan faktor yang tersedia: aklimatisasi, kondisi check-in, profil Klinik berizin, lembur, defisit minum, dan peringatan Band bila perangkat terhubung.")
  if (!risk.medicalAvailable) reasons.push("Tanpa data medis berizin; faktor medis tidak diasumsikan normal.")
  if (moved) reasons.push(`Pindah dari ${moved.from} ke zona rata-rata ${moved.delta.toFixed(1).replace(".", ",")} °C lebih panas: aklimatisasi ulang perlu dikonfirmasi HSE.`)
  if (wave) reasons.push(wave.firstDay ? `Gelombang panas hari pertama (ISBB maks +${wave.delta.toFixed(1).replace(".", ",")} °C dari rata-rata 7 hari): batas harian −50%.` : `Gelombang panas berlanjut (+${wave.delta.toFixed(1).replace(".", ",")} °C dari rata-rata 7 hari).`)
  if (requiresConfirmation) reasons.push("Riwayat adaptasi perlu dikonfirmasi HSE.")
  if (unknownPpe) reasons.push("Jenis APD belum memiliki koreksi pada konfigurasi aturan.")
  if (restriction) reasons.push("Pembatasan kerja dari Klinik: tinjau ulang penugasan tanpa rincian medis.")
  if (risk.day) reasons.push(`${percent}% × ${NORMAL_PAPARAN_MENIT} menit = ${dailyCap} menit; batas NAB per jam tetap berlaku.`)
  const intervals: IntervalPlan[] = JAM_SHIFT.map(hour => {
    const measured = kualitasBacaan(assignment.zonaKode, s.tanggal, hour, s.bacaan, [])
    const forecast = forecastAtPeriod(s.prakiraan, s.tanggal, hour)
    const isMeasured = measured.kualitas === "TERUKUR" || measured.kualitas === "REPLAY"
    const value = isMeasured ? measured.reading?.isbb ?? null : forecast ? estimateForecastWbgt(forecast.suhu, forecast.kelembapan) : null
    if (risk.bandRed) return { jamMulai: hour, isbb: value, kualitas: isMeasured ? measured.kualitas : forecast ? "PRAKIRAAN_SAJA" : "TIDAK_TERSEDIA", barisNab: null, kerjaMaksMenit: 0, kerjaDirencanakan: 0, riskColour: "MERAH", catatan: "Peringatan Band: istirahat di tempat teduh, minum, dan periksa pekerja sebelum kembali bekerja." }
    if (value === null || unknownPpe || requiresConfirmation) return { jamMulai: hour, isbb: value, kualitas: isMeasured ? measured.kualitas : forecast ? "PRAKIRAAN_SAJA" : "TIDAK_TERSEDIA", barisNab: null, kerjaMaksMenit: 0, kerjaDirencanakan: 0, riskColour: "DATA_KURANG", catatan: value === null ? "Data hilang: jangan diasumsikan aman." : unknownPpe ? "Koreksi APD belum tersedia." : "Konfirmasi riwayat adaptasi diperlukan." }
    const corrected = value + correction
    const { row } = cariBaris(ATURAN_FIXTURE, task.beban, corrected)
    const red = stop || !row || (risk.points >= PAPER_RULES.redScore && corrected >= (reference ?? 0) - PAPER_RULES.redMargin) || (!!risk.day && risk.day <= 3 && corrected >= (reference ?? 0))
    const yellow = risk.drinkGap || risk.points >= PAPER_RULES.yellowScore || corrected >= (reference ?? 0) - PAPER_RULES.yellowMargin
    const colour: RiskColour = red ? "MERAH" : yellow ? "KUNING" : "HIJAU"
    const offset = red ? 2 : yellow ? 1 : 0
    const baseIndex = row ? ATURAN_FIXTURE.rows.indexOf(row) : -1
    const finalRow = baseIndex >= 0 ? ATURAN_FIXTURE.rows[baseIndex + offset] : undefined
    const minutes = stop ? 0 : finalRow?.kerjaMaksMenit ?? 0
    return { jamMulai: hour, isbb: Math.round(corrected * 100) / 100, kualitas: isMeasured ? measured.kualitas : "PRAKIRAAN_SAJA", barisNab: minutes > 0 ? finalRow!.label : null, baseMinutes: row?.kerjaMaksMenit ?? 0, kerjaMaksMenit: minutes, kerjaDirencanakan: 0, riskColour: colour, drinkInterval: red ? 15 : yellow ? 20 : 30, catatan: `${isMeasured ? "Station/rekaman" : "Perkiraan BMKG · belum terkalibrasi"}; ISBB′ ${corrected.toFixed(1)} °C. ${row ? `Dasar ${row.label}; ${colour.toLowerCase()} turun ${offset} baris` : "Tidak ada baris NAB yang memenuhi"}. ${minutes} menit kerja/jam.` }
  })
  let remaining = dailyCap
  for (const interval of [...intervals].sort((a,b) => (a.isbb ?? Infinity) - (b.isbb ?? Infinity) || a.jamMulai - b.jamMulai)) {
    interval.kerjaDirencanakan = Math.min(interval.kerjaMaksMenit, remaining)
    remaining -= interval.kerjaDirencanakan
  }
  const total = intervals.reduce((sum,row) => sum + row.kerjaDirencanakan,0)
  const colourRank: Record<RiskColour, number> = { HIJAU:0, KUNING:1, MERAH:2, DATA_KURANG:3 }
  const colour = intervals.map(row => row.riskColour!).sort((a,b)=>colourRank[b]-colourRank[a])[0]
  const missing = intervals.filter(row => row.riskColour === "DATA_KURANG")
  const qualityRank = { TERUKUR:0, REPLAY:1, PRAKIRAAN_SAJA:2, KEDALUWARSA:3, TIDAK_TERSEDIA:4 }
  const quality = intervals.map(row=>row.kualitas).sort((a,b)=>qualityRank[b]-qualityRank[a])[0]
  if (missing.length) reasons.push(`Data belum lengkap pada ${missing.map(row=>rentangJam(row.jamMulai)).join(", ")}.`)
  if (intervals.some(row=>row.kualitas === "PRAKIRAAN_SAJA")) reasons.push("ISBB prakiraan adalah aproksimasi suhu/kelembapan, belum dikalibrasi di lokasi. Bukan pengukuran Station.")
  reasons.push(`Skor P ${risk.points}; bobot dan margin mengikuti parameter aturan ${PAPER_RULES.version}. Alokasi mengisi jam lebih sejuk dahulu.`)
  return { tanggal:s.tanggal, pekerjaKode:worker.kode, zonaKode:assignment.zonaKode, tugasKode:assignment.tugasKode, aturanVersi:PAPER_RULES.version, riskColour:colour, personalScore:risk.points, medicalDataAvailable:risk.medicalAvailable, peringatanBand:risk.band,
    status: colour === "DATA_KURANG" ? "TINJAU_HSE" : colour === "MERAH" ? "BATASI_ATAU_PINDAHKAN" : risk.day ? "ADAPTASI_DIPERLUKAN" : "RENCANA_TERSEDIA", kualitas:quality,
    belumLayak:total === 0, batasHarianMenit:dailyCap, persenAdaptasi:percent, totalKerjaMenit:total, intervals, alasan:reasons, usulan:["Ikuti jadwal kerja–istirahat per jam. Periksa perubahan bacaan selama shift; perubahan yang memperketat perlu persetujuan HSE."] }
}

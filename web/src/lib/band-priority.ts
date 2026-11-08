import { currentBandAllocations } from "./band-management"
import { hasConsent } from "./clinic"
import { BAND_UNITS } from "./config"
import { currentShift } from "./management-state"
import { greenLastShifts } from "./acclimatisation-triggers"
import { rencanaAktif } from "./store-plans"
import type { AppState } from "./store-state"
import type { RiskColour } from "./types"

const COLOUR_RANK: Record<RiskColour, number> = { MERAH: 0, KUNING: 1, HIJAU: 2, DATA_KURANG: 3 }

/**
 * Morning Band allocation order for consented participants of the current shift: red before
 * yellow before green, then acclimatisation days 1–7, then the highest personal score.
 */
export function bandPriority(s: AppState) {
  const shift = currentShift(s)
  if (!shift) return []
  const plans = rencanaAktif(s)
  return shift.workspace.pekerja.filter(worker => hasConsent(s, worker.kode, "BAND")).map(worker => {
    const plan = plans.find(row => row.pekerjaKode === worker.kode)
    const confirmation = s.konfirmasi.find(row => row.pekerjaKode === worker.kode)
    const acclimatising = confirmation?.profil !== undefined && confirmation.profil !== "NORMAL" && confirmation.hariAdaptasi <= 7
    return { kode: worker.kode, colour: plan?.riskColour ?? "DATA_KURANG", acclimatising, score: plan?.personalScore ?? 0 }
  }).toSorted((a, b) => COLOUR_RANK[a.colour] - COLOUR_RANK[b.colour] || Number(b.acclimatising) - Number(a.acclimatising) || b.score - a.score)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

/** Free units go to the highest-ranked workers without a Band, top down until units run out. */
export function suggestedAllocations(s: AppState) {
  const active = currentBandAllocations(s)
  const free = BAND_UNITS.filter(bandId => !active.some(row => row.bandId === bandId))
  const waiting = bandPriority(s).filter(row => !active.some(item => item.pekerjaKode === row.kode))
  return free.slice(0, waiting.length).map((bandId, index) => ({ bandId, pekerjaKode: waiting[index].kode }))
}

/** Release rule: acclimatisation finished (day > 7 or normal profile) and green on the last three shifts. */
export function releaseSuggested(s: AppState, code: string) {
  const confirmation = s.konfirmasi.find(row => row.pekerjaKode === code)
  if (confirmation && confirmation.profil !== "NORMAL" && confirmation.hariAdaptasi <= 7) return false
  return greenLastShifts(s, code)
}

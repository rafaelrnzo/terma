import { managementOf } from "./management-state"
import type { AppState } from "./store-state"

/** Suggest the next confirmed day from recorded attendance, never from roster selection alone. */
export function acclHistorySuggestion(s: AppState, code: string) {
  const shifts=managementOf(s).shifts.filter(shift=>shift.tanggal<s.tanggal).toSorted((a,b)=>b.tanggal.localeCompare(a.tanggal))
  for(const shift of shifts) {
    const confirmation=shift.workspace.konfirmasi.find(row=>row.pekerjaKode===code)
    if(!confirmation)continue
    if(confirmation.profil==="NORMAL")return null
    const attended=shift.readiness?.checkins.some(row=>row.pekerjaKode===code) || shift.workspace.kehadiran.some(row=>row.pekerjaKode===code && row.tanggal===shift.tanggal && row.status==="HADIR")
    const day=Math.min(14,confirmation.hariAdaptasi+(attended ? 1 : 0))
    return {profile:confirmation.profil,day,previousDate:shift.tanggal}
  }
  return null
}

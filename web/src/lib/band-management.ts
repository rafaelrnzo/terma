import { currentShift, managementOf } from "./management-state"
import { hasConsent } from "./clinic"
import { BAND_UNITS, hariIni } from "./config"
import { audit, notice, now, userById } from "./store-utils"
import type { AppState } from "./store-state"
import type { ShiftRecord } from "./management-types"
import type { Role } from "./types"

export interface BandAllocation { id: string; bandId: string; pekerjaKode: string; ditugaskanPada: string; oleh: string; dipakaiPada?: string; dikembalikanPada?: string; dibatalkanPada?: string }
export type BandAction =
  | { type: "ATUR_BAND"; bandId: string; pekerjaKode: string }
  | { type: "SERAH_BAND" | "KEMBALI_BAND"; allocationId: string }
export function currentBandAllocations(s: AppState) { return (currentShift(s)?.bands ?? []).filter(row=>!row.dikembalikanPada && !row.dibatalkanPada) }
export function canHandOverBand(shift: Pick<ShiftRecord, "status" | "tanggal">, role: Role) {
  return shift.status === "ACTIVE" || (role === "ADMIN" && shift.status === "DRAFT" && shift.tanggal === hariIni())
}
export function canReturnBand(shift: Pick<ShiftRecord, "status">, role: Role) {
  return shift.status === "ACTIVE" || (role === "ADMIN" && shift.status === "DRAFT")
}
export function manageBand(s: AppState, action: BandAction): AppState {
  const shift=currentShift(s), user=userById(s.sesi?.userId)
  if (!shift || !user || shift.status === "CLOSED") return notice(s,"error","Buka shift yang belum ditutup.")
  const active=currentBandAllocations(s)
  let bands=shift.bands ?? []
  if (action.type === "ATUR_BAND") {
    if (user.role !== "HSE" && user.role !== "ADMIN") return notice(s,"error","Hanya HSE atau Admin yang menetapkan pemakai Band.")
    if (!BAND_UNITS.includes(action.bandId) || !s.pekerja.some(row=>row.kode===action.pekerjaKode)) return notice(s,"error","Band atau peserta tidak tersedia.")
    if (!hasConsent(s,action.pekerjaKode,"BAND")) return notice(s,"error","Persetujuan Band aktif diperlukan.")
    const occupied=active.find(row=>row.bandId===action.bandId)
    if (occupied?.pekerjaKode===action.pekerjaKode) return notice(s,"info","Penugasan Band sudah tercatat.")
    if (occupied?.dipakaiPada) return notice(s,"error","Band masih dipakai. Catat pengembalian dan pembersihan sebelum dialihkan.")
    if (active.some(row=>row.pekerjaKode===action.pekerjaKode)) return notice(s,"error","Pekerja sudah ditugaskan ke Band lain.")
    const time=now()
    bands=[...bands.map(row=>row.id===occupied?.id ? {...row,dibatalkanPada:time} : row),{id:`${action.bandId}:${shift.id}:${bands.length+1}`,bandId:action.bandId,pekerjaKode:action.pekerjaKode,ditugaskanPada:time,oleh:user.nama}]
  } else {
    const allocation=active.find(row=>row.id===action.allocationId)
    const worker=s.pekerja.find(row=>row.kode===allocation?.pekerjaKode)
    if (!allocation || !worker || (user.role !== "ADMIN" && (user.role !== "MANDOR" || worker.reguKode !== user.reguKode))) return notice(s,"error","Serah-terima hanya untuk Band regu Anda.")
    const allowed = action.type === "SERAH_BAND" ? canHandOverBand(shift, user.role) : canReturnBand(shift, user.role)
    if (!allowed) return notice(s,"error", user.role === "ADMIN" ? "Pemantauan Band dimulai pada shift hari ini atau shift berjalan." : "Serah-terima dilakukan pada shift berjalan.")
    if (action.type === "SERAH_BAND" && !hasConsent(s,worker.kode,"BAND")) return notice(s,"error","Persetujuan Band sudah tidak aktif.")
    if (action.type === "SERAH_BAND" && allocation.dipakaiPada) return notice(s,"info","Pemakaian Band sudah tercatat.")
    if (action.type === "KEMBALI_BAND" && !allocation.dipakaiPada) return notice(s,"error","Band belum diserahkan kepada pekerja.")
    bands=bands.map(row=>row.id===allocation.id ? {...row,...(action.type === "SERAH_BAND" ? {dipakaiPada:now()} : {dikembalikanPada:now()})} : row)
  }
  const m=managementOf(s)
  const updated={...s,management:{...m,shifts:m.shifts.map(row=>row.id===shift.id ? {...row,bands} : row)}}
  return notice(audit(updated,action.type,`${shift.id}: penugasan/serah-terima Band dicatat oleh ${user.nama}.`),"ok","Catatan Band tersimpan.")
}

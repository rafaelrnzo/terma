import type { Tindakan } from "./types"

export const FILTER_TINDAKAN = [
  { value: "SEMUA", label: "Semua status" },
  { value: "MENUNGGU", label: "Menunggu laporan" },
  { value: "VERIFIKASI", label: "Perlu verifikasi" },
  { value: "TERVERIFIKASI", label: "Terverifikasi" },
  { value: "BELUM_SELESAI", label: "Belum selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
] as const

/** Presentation grouping only; never changes the recorded lifecycle. */
export function kelompokTindakan(t: Tindakan, dibatalkan: boolean) {
  if (dibatalkan) return "DIBATALKAN"
  if (t.status === "TINDAKAN_DILAPORKAN") return "VERIFIKASI"
  if (t.status === "TERVERIFIKASI" || t.status === "BELUM_SELESAI") return t.status
  return "MENUNGGU"
}

export function cocokPencarianTindakan(t: Tindakan, nama: string, query: string) {
  const text = `${nama} ${t.id} ${t.pekerjaKode} ${t.reguKode} ${t.deskripsi}`.toLocaleLowerCase("id-ID")
  return query.trim().toLocaleLowerCase("id-ID").split(/\s+/).every((term) => text.includes(term))
}

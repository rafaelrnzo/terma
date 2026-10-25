// Access rules (PRD F-PRIV-01). Enforced in the data layer: both the reducer (writes) and the
// selectors below (reads) go through these checks, so hiding a menu item is never the only guard.

import type { Pekerja, Role, User } from "./types"

export type Aksi =
  | "MUAT_DEMO"
  | "IMPOR"
  | "KONFIRMASI_PAPARAN"
  | "INPUT_PENGUKURAN"
  | "HITUNG_RENCANA"
  | "ATUR_TANGGAL"
  | "SETUJUI_RENCANA"
  | "UBAH_PENUGASAN"
  | "KIRIM_INSTRUKSI"
  | "AKUI_PESAN"
  | "LAPOR_TINDAKAN"
  | "VERIFIKASI"

const IZIN: Record<Aksi, Role[]> = {
  MUAT_DEMO: ["HSE"],
  IMPOR: ["PETUGAS_DATA", "HSE"],
  KONFIRMASI_PAPARAN: ["HSE"],
  INPUT_PENGUKURAN: ["PETUGAS_DATA", "HSE"],
  HITUNG_RENCANA: ["HSE"],
  ATUR_TANGGAL: ["HSE", "PETUGAS_DATA"],
  SETUJUI_RENCANA: ["HSE"],
  UBAH_PENUGASAN: ["HSE"],
  KIRIM_INSTRUKSI: ["HSE"],
  AKUI_PESAN: ["MANDOR"],
  LAPOR_TINDAKAN: ["MANDOR"],
  VERIFIKASI: ["HSE"],
}

export class AksesDitolak extends Error {
  constructor(pesan: string) {
    super(pesan)
    this.name = "AksesDitolak"
  }
}

export function boleh(user: User, aksi: Aksi, reguKode?: string): boolean {
  if (!IZIN[aksi].includes(user.role)) return false
  if (user.role === "MANDOR" && reguKode !== undefined && reguKode !== user.reguKode) return false
  return true
}

export function wajib(user: User, aksi: Aksi, reguKode?: string) {
  if (!boleh(user, aksi, reguKode))
    throw new AksesDitolak(
      reguKode && user.role === "MANDOR"
        ? `${user.nama} tidak ditugaskan pada regu ${reguKode}.`
        : `Peran ${user.role} tidak berwenang untuk ${aksi}.`,
    )
}

/** Read scope: a foreman only sees workers of the crew they are assigned to. */
export function lingkupPekerja(user: User, pekerja: Pekerja[]): Pekerja[] {
  if (user.role === "MANDOR") return pekerja.filter((p) => p.reguKode === user.reguKode)
  return pekerja
}

export function lihatRegu(user: User, reguKode: string) {
  if (user.role === "MANDOR" && user.reguKode !== reguKode)
    throw new AksesDitolak(`${user.nama} tidak ditugaskan pada regu ${reguKode}. Akses ditolak di lapisan data.`)
}

export const LABEL_PERAN: Record<Role, string> = {
  HSE: "HSE",
  MANDOR: "Mandor",
  PETUGAS_DATA: "Petugas data",
}

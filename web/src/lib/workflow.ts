import { lingkupPekerja } from "./access"
import { JAM_SHIFT, ZONA } from "./config"
import { kualitasBacaan } from "./rules"
import { kandidatUntuk, rencanaAktif, type AppState } from "./store"
import type { Role, User } from "./types"

export interface WorkflowStep {
  href: string
  no: string
  label: string
  peran: Role[]
  selesai: boolean
  progress: string
}

/** Progress describes the complete current scope, never a single successful record. */
export function workflow(s: AppState, user: User): WorkflowStep[] {
  const pekerja = lingkupPekerja(user, s.pekerja)
  const ids = new Set(pekerja.map((p) => p.kode))
  const penugasan = s.penugasan.filter((p) => ids.has(p.pekerjaKode))
  const lengkap = pekerja.filter((p) => penugasan.some((a) => a.pekerjaKode === p.kode) && (p.tanggalMulai === s.tanggal || s.kehadiran.some((k) => k.pekerjaKode === p.kode && k.tanggal <= s.tanggal))).length
  const kandidat = pekerja.filter((p) => kandidatUntuk(s, p).pemicu)
  const dikonfirmasi = kandidat.filter((p) => s.konfirmasi.some((k) => k.pekerjaKode === p.kode)).length
  const zona = penugasan.length ? [...new Set(penugasan.map((p) => p.zonaKode))] : ZONA.map((z) => z.kode)
  const kualitas = zona.flatMap((z) => JAM_SHIFT.map((h) => kualitasBacaan(z, s.tanggal, h, s.bacaan, s.prakiraan).kualitas))
  const valid = kualitas.filter((q) => q === "TERUKUR" || q === "REPLAY").length
  const rencana = rencanaAktif(s).filter((r) => ids.has(r.pekerjaKode))
  const disetujui = rencana.filter((r) => r.disetujuiOleh).length
  const semuaDisetujui = pekerja.length > 0 && disetujui === pekerja.length
  const diakui = rencana.filter((r) => s.pengiriman.some((p) => p.status !== "GAGAL" && p.diakui && p.id.split(":")[1]?.split("+").includes(r.id))).length
  const rencanaIds = new Set(rencana.map((r) => r.id))
  const tindakan = s.tindakan.filter((t) => rencanaIds.has(t.rencanaId))
  const verified = tindakan.filter((t) => t.status === "TERVERIFIKASI").length
  const semuaTindakan = semuaDisetujui && rencana.every((r) => tindakan.some((t) => t.rencanaId === r.id))
  return [
    { href: "/impor", no: "1", label: "Impor & validasi", peran: ["PETUGAS_DATA", "HSE"], selesai: pekerja.length > 0 && lengkap === pekerja.length, progress: pekerja.length ? `${lengkap}/${pekerja.length} pekerja dengan data awal` : "Belum ada data pekerja" },
    { href: "/paparan", no: "2", label: "Paparan & adaptasi", peran: ["HSE"], selesai: pekerja.length > 0 && dikonfirmasi === kandidat.length, progress: kandidat.length ? `${dikonfirmasi}/${kandidat.length} pekerja dikonfirmasi` : pekerja.length ? "Tidak ada kandidat adaptasi" : "Menunggu data pekerja" },
    { href: "/pengukuran", no: "3", label: "Pengukuran WBGT", peran: ["PETUGAS_DATA", "HSE"], selesai: valid === kualitas.length, progress: `${valid}/${kualitas.length} interval dengan bacaan valid` },
    { href: "/rencana", no: "4", label: "Rencana & persetujuan", peran: ["HSE"], selesai: semuaDisetujui, progress: pekerja.length ? `${disetujui}/${pekerja.length} rencana disetujui` : "Menunggu data pekerja" },
    { href: "/instruksi", no: "5", label: "Instruksi mandor", peran: ["HSE", "MANDOR"], selesai: semuaDisetujui && diakui === rencana.length, progress: rencana.length ? `${diakui}/${rencana.length} rencana diakui mandor` : "Menunggu rencana" },
    { href: "/tindakan", no: "6", label: "Tindakan & verifikasi", peran: ["MANDOR", "HSE"], selesai: semuaTindakan && tindakan.length > 0 && verified === tindakan.length, progress: tindakan.length ? `${verified}/${tindakan.length} tindakan terverifikasi` : "Menunggu tindakan" },
    { href: "/laporan", no: "7", label: "Laporan & audit", peran: ["HSE"], selesai: false, progress: "Rekap tanggal aktif" },
  ]
}

export function nextWorkflowStep(s: AppState, user: User) {
  const steps = workflow(s, user)
  if (user.role === "MANDOR") {
    const rs = rencanaAktif(s).filter((r) => s.pekerja.some((p) => p.kode === r.pekerjaKode && p.reguKode === user.reguKode))
    const ids = new Set(rs.map((r) => r.id))
    const perluLapor = s.tindakan.some((t) => ids.has(t.rencanaId) && t.status === "DIAKUI")
    return perluLapor ? steps[5] : steps[4].selesai ? steps[5] : steps[4]
  }
  return steps.find((st) => st.peran.includes(user.role) && !st.selesai) ?? steps[2]
}

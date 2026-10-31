import { ATURAN_FIXTURE, LOKASI, REGU, TUGAS } from "./config"
import { deteksiKandidat, hitungRencana, namaZona, rentangJam } from "./rules"
import { audit, now } from "./store-utils"
import type { AppState } from "./store-state"
import type { Pekerja, Rencana } from "./types"

export function kandidatUntuk(s: AppState, p: Pekerja) {
  return deteksiKandidat(p, s.kehadiran, s.tanggal)
}

export function rencanaAktif(s: AppState) {
  return s.rencana.filter((r) => !r.digantikan && r.tanggal === s.tanggal)
}

export function rencanaTanggal(s: AppState) {
  return s.rencana.filter((r) => r.tanggal === s.tanggal)
}

export function recompute(s: AppState): AppState {
  if (!s.rencanaDihitung) return s
  let rencana = [...s.rencana]
  let n = s
  for (const p of s.pekerja) {
    const pn = s.penugasan.find((x) => x.pekerjaKode === p.kode)
    if (!pn) continue
    const tugas = TUGAS.find((t) => t.kode === pn.tugasKode)!
    const hasil = hitungRencana({
      tanggal: s.tanggal,
      pekerja: p,
      penugasan: pn,
      tugas,
      kandidat: kandidatUntuk(s, p),
      konfirmasi: s.konfirmasi.find((k) => k.pekerjaKode === p.kode),
      bacaan: s.bacaan,
      prakiraan: s.prakiraan,
      aturan: ATURAN_FIXTURE,
    })
    const sig = JSON.stringify([pn.zonaKode, pn.tugasKode, hasil.status, hasil.kualitas, hasil.batasHarianMenit, hasil.intervals.map((i) => [i.kualitas, i.kerjaDirencanakan])])
    const current = rencana.find((r) => r.pekerjaKode === p.kode && r.tanggal === s.tanggal && !r.digantikan)
    const base = { ...hasil, sig, tanggal: s.tanggal, zonaKode: pn.zonaKode, tugasKode: pn.tugasKode, aturanVersi: ATURAN_FIXTURE.versi, dibuat: now(), pekerjaKode: p.kode }
    if (!current) {
      rencana.push({ ...base, id: `${p.kode}-v1@${s.tanggal}`, version: 1 })
      continue
    }
    if (current.sig === sig) continue
    if (current.disetujuiOleh) {
      const v = current.version + 1
      rencana = rencana.map((r) => (r.id === current.id ? { ...r, digantikan: true } : r))
      rencana.push({ ...base, id: `${p.kode}-v${v}@${s.tanggal}`, version: v })
      n = audit(n, "RENCANA_BERUBAH", `${p.nama}: ${current.id} disetujui lalu input berubah → v${v} perlu persetujuan ulang. Versi lama tetap tersimpan.`)
    } else {
      rencana = rencana.map((r) => (r.id === current.id ? { ...base, id: current.id, version: current.version } : r))
    }
  }
  return { ...n, rencana }
}

export function deskripsiTindakan(r: Rencana, p: Pekerja): string[] {
  const tugas = TUGAS.find((t) => t.kode === r.tugasKode)!
  const out: string[] = []
  const blok = r.intervals.filter((i) => i.barisNab === null && (i.kualitas === "TERUKUR" || i.kualitas === "REPLAY"))
  if (blok.length > 0)
    out.push(`Hentikan ${tugas.nama.toLowerCase()} ${p.nama} di ${namaZona(r.zonaKode)} jam ${blok.map((b) => rentangJam(b.jamMulai)).join(", ")}; pindahkan waktu/zona atau ganti tugas yang telah dinilai.`)
  if (r.status === "TINJAU_HSE") out.push(`Jangan tugaskan ${p.nama} pada paparan panas sampai tinjauan HSE selesai (lihat alasan rencana ${r.id}).`)
  if (r.status === "ADAPTASI_DIPERLUKAN") out.push(`Terapkan jadwal adaptasi ${p.nama}: maks ${r.batasHarianMenit} menit paparan panas hari ini, ikuti alokasi per jam.`)
  if (out.length === 0) out.push(`Terapkan jadwal kerja-istirahat ${p.nama} sesuai rencana ${r.id}.`)
  return out
}

export function isiPesan(s: AppState, reguKode: string): { teks: string; rencanaIds: string[] } {
  const regu = REGU.find((r) => r.kode === reguKode)!
  const rs = rencanaAktif(s).filter((r) => r.disetujuiOleh && s.pekerja.find((p) => p.kode === r.pekerjaKode)?.reguKode === reguKode)
  const sumber = [...new Set(rs.map((r) => `${namaZona(r.zonaKode)}: ${r.kualitas.replace(/_/g, " ")}`))].join("; ")
  const baris = rs.map((r) => {
    const p = s.pekerja.find((x) => x.kode === r.pekerjaKode)!
    return `• ${p.nama} · ${r.status.replace(/_/g, " ")}. ${deskripsiTindakan(r, p).join(" ")}`
  })
  const teks = [
    ...(s.demo && s.demo.versi !== "workspace-v3" ? ["SUMBER: DATA CONTOH HISTORIS"] : []),
    `TERMA · ${regu.nama}, ${LOKASI}, ${s.tanggal}.`,
    `Sumber: ${sumber || "Belum tersedia"}; aturan ${ATURAN_FIXTURE.versi}${ATURAN_FIXTURE.isFixture ? " (belum disahkan)" : ""}.`,
    ...baris,
    "Mohon akui penerimaan di TERMA lalu catat tindakan dan waktunya. Pengakuan pesan belum berarti tindakan terlaksana.",
    "Pesan ini tidak menyatakan pekerja sehat atau aman secara medis. Keluhan atau dugaan darurat: ikuti SOP lokasi, jangan menunggu aplikasi.",
    `Versi rencana: ${rs.map((r) => r.id).join(", ")}`,
  ].join("\n")
  return { teks, rencanaIds: rs.map((r) => r.id) }
}

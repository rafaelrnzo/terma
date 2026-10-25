"use client"

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react"
import { AksesDitolak, boleh, wajib, type Aksi } from "./access"
import { ATURAN_FIXTURE, JAM_SHIFT, LOKASI, REGU, TUGAS, USERS, ZONA, awalInterval, hariIni } from "./config"
import { deteksiKandidat, hitungRencana, namaZona, rentangJam } from "./rules"
import { bisaMuatDemo, dataDemo, DEMO_VERSION } from "./seed-data"
import type {
  AcclProfile,
  AuditEntry,
  ImportResult,
  ImportRowResult,
  Kehadiran,
  KonfirmasiPaparan,
  Pekerja,
  Penugasan,
  Pengiriman,
  PengukuranWBGT,
  PrakiraanCuaca,
  Rencana,
  Tindakan,
  User,
} from "./types"

export interface AppState {
  demo?: { versi: string; tanggal: string }
  sesi: { userId: string; masuk: string } | null
  tanggal: string // plan date
  pekerja: Pekerja[]
  kehadiran: Kehadiran[]
  penugasan: Penugasan[]
  konfirmasi: KonfirmasiPaparan[]
  bacaan: PengukuranWBGT[]
  prakiraan: PrakiraanCuaca[]
  rencana: Rencana[]
  rencanaDihitung: boolean
  tindakan: Tindakan[]
  pengiriman: Pengiriman[]
  imporLog: ImportResult[]
  audit: AuditEntry[]
  notice?: { id: number; tipe: "ok" | "error" | "info"; pesan: string }
}

/** The app opens as the site HSE officer; switching user happens in the header. */
export const PENGGUNA_AWAL = "hse-ratna"

export function stateAwal(tanggal = hariIni()): AppState {
  return {
    sesi: { userId: PENGGUNA_AWAL, masuk: new Date().toISOString() },
    tanggal,
    pekerja: [],
    kehadiran: [],
    penugasan: [],
    konfirmasi: [],
    bacaan: [],
    prakiraan: [],
    rencana: [],
    rencanaDihitung: false,
    tindakan: [],
    pengiriman: [],
    imporLog: [],
    audit: [],
  }
}

export type Action =
  | { type: "MUAT_DEMO" }
  | { type: "LOGIN"; userId: string }
  | { type: "SET_TANGGAL"; tanggal: string }
  | { type: "IMPOR_PEKERJA"; csv: string; source: string }
  | { type: "IMPOR_KEHADIRAN"; csv: string; source: string }
  | { type: "IMPOR_PENGUKURAN"; csv: string; source: string }
  | { type: "IMPOR_PRAKIRAAN"; csv: string; source: string }
  | { type: "KONFIRMASI"; pekerjaKode: string; profil: AcclProfile | "NORMAL"; hari: number }
  | { type: "INPUT_BACAAN"; zonaKode: string; jamMulai: number; isbb: number; idAlat: string; kalibrasi: string }
  | { type: "HITUNG_RENCANA" }
  | { type: "SETUJUI"; rencanaId: string }
  | { type: "UBAH_PENUGASAN"; pekerjaKode: string; zonaKode: string; tugasKode: string }
  | { type: "BAGIKAN"; reguKode: string; kanal: string }
  | { type: "TANDAI_GAGAL"; pengirimanId: string; alasan: string }
  | { type: "AKUI"; pengirimanId: string }
  | { type: "LAPOR"; tindakanId: string; dijalankan: boolean; pelaksana: string; waktu: string; menit: number; alasan?: string }
  | { type: "VERIFIKASI"; tindakanId: string; hasil: "TERVERIFIKASI" | "BELUM_SELESAI"; menit: number }
  | { type: "HYDRATE"; state: AppState }

let noticeSeq = 0
const now = () => new Date().toISOString()
export const userById = (id?: string): User | null => USERS.find((u) => u.id === id) ?? null
const aktor = (s: AppState) => userById(s.sesi?.userId)

function audit(s: AppState, aksi: string, detail: string, nama?: string): AppState {
  return { ...s, audit: [{ waktu: now(), aktor: nama ?? aktor(s)?.nama ?? "Belum tersedia", aksi, detail: s.demo ? `[SIMULASI] ${detail}` : detail }, ...s.audit] }
}
function notice(s: AppState, tipe: "ok" | "error" | "info", pesan: string): AppState {
  return { ...s, notice: { id: ++noticeSeq, tipe, pesan } }
}

// ---------------------------------------------------------------- CSV import (validated per row, idempotent)

const ISO = /^\d{4}-\d{2}-\d{2}$/
function tanggalValid(s: string) {
  if (!ISO.test(s)) return false
  const d = new Date(s + "T00:00:00Z")
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
const angka = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")))

type BarisFn<T> = (cols: string[], tolak: (alasan: string) => void) => { kunci: string; nilai: T } | void

function parseCsv<T>(csv: string, kolomMin: number, fn: BarisFn<T>) {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim() !== "")
  const ditolak: ImportRowResult[] = []
  const hasil: { kunci: string; nilai: T }[] = []
  const diFile = new Set<string>()
  lines.slice(1).forEach((line, i) => {
    const baris = i + 2
    const cols = line.split(",").map((x) => x.trim())
    let alasanTolak: string | undefined
    const tolak = (alasan: string) => {
      alasanTolak = alasan
    }
    if (cols.length < kolomMin) tolak(`Jumlah kolom kurang (${cols.length} dari ${kolomMin})`)
    const r = alasanTolak ? undefined : fn(cols, tolak)
    if (!alasanTolak && r) {
      if (diFile.has(r.kunci)) alasanTolak = `Identitas duplikat dalam berkas: ${r.kunci}`
      else {
        diFile.add(r.kunci)
        hasil.push(r)
      }
    }
    if (alasanTolak) ditolak.push({ baris, data: line, ok: false, alasan: alasanTolak })
  })
  return { hasil, ditolak, kosong: lines.length <= 1 }
}

function catatImpor(s: AppState, jenis: ImportResult["jenis"], source: string, diterima: number, baru: number, sudahAda: number, ditolak: ImportRowResult[], label: string): AppState {
  const r: ImportResult = { jenis, waktu: now(), diterima, baru, sudahAda, ditolak }
  const n = audit({ ...s, imporLog: [r, ...s.imporLog] }, "IMPOR", `${label} dari ${source}: ${baru} baru, ${sudahAda} sudah ada, ${ditolak.length} ditolak`)
  return notice(
    n,
    ditolak.length > 0 && diterima === 0 ? "error" : "ok",
    sudahAda > 0 && baru === 0 ? `${label}: ${sudahAda} catatan sudah ada, tidak digandakan. ${ditolak.length} baris ditolak.` : `${label}: ${baru} catatan baru. ${ditolak.length} baris ditolak.`,
  )
}

function imporPekerja(s: AppState, csv: string, source: string): AppState {
  const { hasil, ditolak, kosong } = parseCsv<{ p: Pekerja; pn: Penugasan }>(csv, 7, ([kode, nama, regu, tgl, tugas, zona, apd], tolak) => {
    if (!kode || !nama) return tolak("Kolom wajib kosong")
    if (!REGU.some((r) => r.kode === regu)) return tolak(`Regu tidak dikenal: ${regu}`)
    if (!tanggalValid(tgl)) return tolak(`Tanggal tidak masuk akal: ${tgl}`)
    if (tgl > s.tanggal) return tolak(`Tanggal mulai setelah tanggal rencana: ${tgl}`)
    if (!TUGAS.some((t) => t.kode === tugas)) return tolak(`Tugas tidak dikenal: ${tugas}`)
    if (!ZONA.some((z) => z.kode === zona)) return tolak(`Zona tidak dikenal: ${zona}`)
    return {
      kunci: kode,
      nilai: {
        p: { kode, nama, reguKode: regu, tanggalMulai: tgl, source, origin: "AKTUAL" },
        pn: { pekerjaKode: kode, tugasKode: tugas, zonaKode: zona, apd: apd || "Standar", apdBerubah: (apd || "Standar") !== "Standar", version: 1 },
      },
    }
  })
  if (kosong) return notice(s, "error", "Berkas kosong atau hanya berisi header.")
  const ada = new Set(s.pekerja.map((p) => p.kode))
  const baru = hasil.filter((h) => !ada.has(h.kunci))
  return catatImpor(
    { ...s, pekerja: [...s.pekerja, ...baru.map((b) => b.nilai.p)], penugasan: [...s.penugasan, ...baru.map((b) => b.nilai.pn)] },
    "pekerja",
    source,
    hasil.length,
    baru.length,
    hasil.length - baru.length,
    ditolak,
    "Pekerja & penugasan",
  )
}

function imporKehadiran(s: AppState, csv: string, source: string): AppState {
  const { hasil, ditolak, kosong } = parseCsv<Kehadiran>(csv, 3, ([kode, tgl, status], tolak) => {
    if (!s.pekerja.some((p) => p.kode === kode)) return tolak(`Pekerja tidak dikenal: ${kode}`)
    if (!tanggalValid(tgl)) return tolak(`Tanggal tidak masuk akal: ${tgl}`)
    if (!["HADIR", "CUTI", "SAKIT", "ALFA"].includes(status)) return tolak(`Status tidak dikenal: ${status}`)
    return { kunci: `${kode}|${tgl}`, nilai: { pekerjaKode: kode, tanggal: tgl, status: status as Kehadiran["status"], source } }
  })
  if (kosong) return notice(s, "error", "Berkas kosong atau hanya berisi header.")
  const ada = new Set(s.kehadiran.map((k) => `${k.pekerjaKode}|${k.tanggal}`))
  const baru = hasil.filter((h) => !ada.has(h.kunci))
  return catatImpor({ ...s, kehadiran: [...s.kehadiran, ...baru.map((b) => b.nilai)] }, "kehadiran", source, hasil.length, baru.length, hasil.length - baru.length, ditolak, "Kehadiran")
}

function imporPengukuran(s: AppState, csv: string, source: string): AppState {
  const { hasil, ditolak, kosong } = parseCsv<PengukuranWBGT>(csv, 8, ([zona, tgl, jamS, isbbS, idAlat, pencatat, kalibrasi, jenis, waktuCatat], tolak) => {
    if (!ZONA.some((z) => z.kode === zona)) return tolak(`Zona tidak dikenal: ${zona}`)
    if (!tanggalValid(tgl)) return tolak(`Tanggal tidak masuk akal: ${tgl}`)
    const jam = Number(jamS)
    if (!JAM_SHIFT.includes(jam)) return tolak(`Jam di luar shift: ${jamS}`)
    const isbb = angka(isbbS)
    if (!isFinite(isbb) || isbb < 15 || isbb > 45) return tolak(`ISBB tidak wajar: ${isbbS}`)
    if (!idAlat) return tolak("ID alat wajib diisi")
    if (jenis !== "TERUKUR" && jenis !== "REPLAY") return tolak(`Jenis harus TERUKUR atau REPLAY: ${jenis}`)
    let waktu = waktuCatat
    if (!waktu) waktu = new Date(awalInterval(tgl, jam)).toISOString()
    else if (isNaN(Date.parse(waktu))) return tolak(`Waktu catat tidak valid: ${waktuCatat}`)
    return {
      kunci: `${zona}|${tgl}|${jam}`,
      nilai: { zonaKode: zona, tanggal: tgl, jamMulai: jam, isbb, idAlat, pencatat: pencatat || "Belum tersedia", kalibrasi: kalibrasi || "Belum tersedia", origin: jenis === "REPLAY" ? "REPLAY" : "AKTUAL", waktuCatat: waktu },
    }
  })
  if (kosong) return notice(s, "error", "Berkas kosong atau hanya berisi header.")
  const map = new Map(s.bacaan.map((b) => [`${b.zonaKode}|${b.tanggal}|${b.jamMulai}`, b]))
  let baru = 0
  for (const h of hasil) {
    if (!map.has(h.kunci)) baru++
    map.set(h.kunci, h.nilai) // a corrected reading replaces the earlier one for the same zone and hour
  }
  return catatImpor({ ...s, bacaan: [...map.values()] }, "pengukuran", source, hasil.length, baru, hasil.length - baru, ditolak, "Pengukuran WBGT")
}

function imporPrakiraan(s: AppState, csv: string, source: string): AppState {
  const { hasil, ditolak, kosong } = parseCsv<PrakiraanCuaca>(csv, 7, ([tgl, lokasi, jamS, intS, suhuS, lembabS, produksi], tolak) => {
    if (!tanggalValid(tgl)) return tolak(`Tanggal tidak masuk akal: ${tgl}`)
    const jam = Number(jamS)
    const interval = Number(intS)
    if (!Number.isInteger(jam) || jam < 0 || jam > 23) return tolak(`Jam mulai tidak valid: ${jamS}`)
    if (!Number.isInteger(interval) || interval < 1 || interval > 6) return tolak(`Interval jam tidak valid: ${intS}`)
    const suhu = angka(suhuS)
    const lembab = angka(lembabS)
    if (!isFinite(suhu) || !isFinite(lembab)) return tolak("Suhu atau kelembapan bukan angka")
    if (!produksi || isNaN(Date.parse(produksi))) return tolak(`Waktu produksi tidak valid: ${produksi}`)
    return { kunci: `${tgl}|${jam}`, nilai: { tanggal: tgl, lokasi: lokasi || "Belum tersedia", jamMulai: jam, intervalJam: interval, suhu, kelembapan: lembab, waktuProduksi: produksi } }
  })
  if (kosong) return notice(s, "error", "Berkas kosong atau hanya berisi header.")
  const map = new Map(s.prakiraan.map((p) => [`${p.tanggal}|${p.jamMulai}`, p]))
  let baru = 0
  for (const h of hasil) {
    if (!map.has(h.kunci)) baru++
    map.set(h.kunci, h.nilai)
  }
  return catatImpor({ ...s, prakiraan: [...map.values()] }, "prakiraan", source, hasil.length, baru, hasil.length - baru, ditolak, "Prakiraan BMKG")
}

// ---------------------------------------------------------------- plans (versioned per date)

export function kandidatUntuk(s: AppState, p: Pekerja) {
  return deteksiKandidat(p, s.kehadiran, s.tanggal)
}

export function rencanaAktif(s: AppState) {
  return s.rencana.filter((r) => !r.digantikan && r.tanggal === s.tanggal)
}

export function rencanaTanggal(s: AppState) {
  return s.rencana.filter((r) => r.tanggal === s.tanggal)
}

function recompute(s: AppState): AppState {
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

function deskripsiTindakan(r: Rencana, p: Pekerja): string[] {
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
    ...(s.demo ? ["DATA DEMO / SIMULASI · bukan instruksi operasional. Jangan digunakan untuk penugasan nyata."] : []),
    `TERMA · ${regu.nama}, ${LOKASI}, ${s.tanggal}.`,
    `Sumber: ${sumber || "Belum tersedia"}; aturan ${ATURAN_FIXTURE.versi}${ATURAN_FIXTURE.isFixture ? " (belum disahkan)" : ""}.`,
    ...baris,
    "Mohon akui penerimaan di TERMA lalu catat tindakan dan waktunya. Pengakuan pesan belum berarti tindakan terlaksana.",
    "Pesan ini tidak menyatakan pekerja sehat atau aman secara medis. Keluhan atau dugaan darurat: ikuti SOP lokasi, jangan menunggu aplikasi.",
    `Versi rencana: ${rs.map((r) => r.id).join(", ")}`,
  ].join("\n")
  return { teks, rencanaIds: rs.map((r) => r.id) }
}

// ---------------------------------------------------------------- reducer = data service layer

const IZIN_AKSI: Partial<Record<Action["type"], Aksi>> = {
  MUAT_DEMO: "MUAT_DEMO",
  SET_TANGGAL: "ATUR_TANGGAL",
  IMPOR_PEKERJA: "IMPOR",
  IMPOR_KEHADIRAN: "IMPOR",
  IMPOR_PENGUKURAN: "INPUT_PENGUKURAN",
  IMPOR_PRAKIRAAN: "INPUT_PENGUKURAN",
  INPUT_BACAAN: "INPUT_PENGUKURAN",
  KONFIRMASI: "KONFIRMASI_PAPARAN",
  HITUNG_RENCANA: "HITUNG_RENCANA",
  SETUJUI: "SETUJUI_RENCANA",
  UBAH_PENUGASAN: "UBAH_PENUGASAN",
  BAGIKAN: "KIRIM_INSTRUKSI",
  TANDAI_GAGAL: "KIRIM_INSTRUKSI",
  AKUI: "AKUI_PESAN",
  LAPOR: "LAPOR_TINDAKAN",
  VERIFIKASI: "VERIFIKASI",
}

function reguDari(s: AppState, a: Action): string | undefined {
  if (a.type === "AKUI") return s.pengiriman.find((p) => p.id === a.pengirimanId)?.reguKode
  if (a.type === "LAPOR") return s.tindakan.find((t) => t.id === a.tindakanId)?.reguKode
  return undefined
}

function inner(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "MUAT_DEMO":
      if (!bisaMuatDemo(s)) return notice(s, "info", "Seed tidak dijalankan: ruang kerja sudah berisi data. Tidak ada data yang ditimpa.")
      if (!tanggalValid(s.tanggal)) return notice(s, "error", "Tanggal rencana tidak valid.")
      return muatDemo(s)
    case "HYDRATE":
      return a.state
    case "LOGIN": {
      const u = userById(a.userId)
      if (!u) return notice(s, "error", "Akun tidak dikenal.")
      if (s.sesi?.userId === u.id) return s
      return audit({ ...s, sesi: { userId: u.id, masuk: now() } }, "GANTI_PENGGUNA", `Pengguna aktif: ${u.nama} (${u.role})`, u.nama)
    }
    case "SET_TANGGAL":
      if (!tanggalValid(a.tanggal)) return notice(s, "error", "Tanggal tidak valid.")
      return recompute(audit({ ...s, tanggal: a.tanggal }, "TANGGAL_RENCANA", `Tanggal rencana diubah ke ${a.tanggal}`))
    case "IMPOR_PEKERJA":
      return recompute(imporPekerja(s, a.csv, a.source))
    case "IMPOR_KEHADIRAN":
      return recompute(imporKehadiran(s, a.csv, a.source))
    case "IMPOR_PENGUKURAN":
      return recompute(imporPengukuran(s, a.csv, a.source))
    case "IMPOR_PRAKIRAAN":
      return recompute(imporPrakiraan(s, a.csv, a.source))
    case "KONFIRMASI": {
      const p = s.pekerja.find((x) => x.kode === a.pekerjaKode)
      if (!p) return notice(s, "error", "Pekerja tidak ditemukan.")
      const k: KonfirmasiPaparan = { pekerjaKode: a.pekerjaKode, profil: a.profil, hariAdaptasi: a.hari, dikonfirmasiOleh: aktor(s)!.nama, waktu: now() }
      const n = audit({ ...s, konfirmasi: [...s.konfirmasi.filter((x) => x.pekerjaKode !== a.pekerjaKode), k] }, "KONFIRMASI_PAPARAN", `${p.nama}: profil ${a.profil}, hari ke-${a.hari}`)
      return recompute(notice(n, "ok", `Riwayat paparan ${p.nama} dikonfirmasi.`))
    }
    case "INPUT_BACAAN": {
      const u = aktor(s)!
      const r: PengukuranWBGT = { zonaKode: a.zonaKode, tanggal: s.tanggal, jamMulai: a.jamMulai, isbb: a.isbb, idAlat: a.idAlat, pencatat: u.nama, kalibrasi: a.kalibrasi || "Belum tersedia", origin: "MANUAL", waktuCatat: now() }
      const bacaan = [...s.bacaan.filter((b) => !(b.zonaKode === a.zonaKode && b.tanggal === s.tanggal && b.jamMulai === a.jamMulai)), r]
      const n = audit({ ...s, bacaan }, "PENGUKURAN", `Input manual ${namaZona(a.zonaKode)} ${s.tanggal} ${rentangJam(a.jamMulai)}: ISBB ${a.isbb}°C (${a.idAlat})`)
      return recompute(notice(n, "ok", "Bacaan WBGT dicatat."))
    }
    case "HITUNG_RENCANA": {
      const n = recompute({ ...s, rencanaDihitung: true })
      return notice(audit(n, "HITUNG_RENCANA", `${rencanaAktif(n).length} rencana ${s.tanggal} dihitung dengan ${ATURAN_FIXTURE.versi}`), "ok", "Rencana dihitung.")
    }
    case "SETUJUI": {
      const r = s.rencana.find((x) => x.id === a.rencanaId)
      if (!r || r.digantikan) return notice(s, "error", "Rencana tidak ditemukan atau sudah diganti versi baru.")
      if (r.disetujuiOleh) return notice(s, "info", "Rencana sudah disetujui.")
      const p = s.pekerja.find((x) => x.kode === r.pekerjaKode)!
      const rencana = s.rencana.map((x) => (x.id === r.id ? { ...x, disetujuiOleh: aktor(s)!.nama, waktuPersetujuan: now() } : x))
      const sudah = new Set(s.tindakan.map((t) => t.id))
      const baru: Tindakan[] = deskripsiTindakan(r, p)
        .map((d, i) => ({ id: `${r.id}-T${i + 1}`, rencanaId: r.id, reguKode: p.reguKode, pekerjaKode: p.kode, deskripsi: d, status: "DIBUAT" as const, menitDirencanakan: r.totalKerjaMenit }))
        .filter((t) => !sudah.has(t.id))
      const n = audit({ ...s, rencana, tindakan: [...s.tindakan, ...baru] }, "SETUJUI_RENCANA", `${r.id} (${p.nama}, ${r.status}) disetujui; ${baru.length} tindakan dibuat`)
      return notice(n, "ok", `Rencana ${r.id} (${p.nama}) disetujui.`)
    }
    case "UBAH_PENUGASAN": {
      const p = s.pekerja.find((x) => x.kode === a.pekerjaKode)!
      const penugasan = s.penugasan.map((x) => (x.pekerjaKode === a.pekerjaKode ? { ...x, zonaKode: a.zonaKode, tugasKode: a.tugasKode, version: x.version + 1 } : x))
      const n = audit({ ...s, penugasan }, "UBAH_PENUGASAN", `${p.nama} → ${namaZona(a.zonaKode)}, tugas ${a.tugasKode}`)
      return recompute(notice(n, "ok", `Penugasan ${p.nama} diubah. Rencana dihitung ulang.`))
    }
    case "BAGIKAN": {
      const { teks, rencanaIds } = isiPesan(s, a.reguKode)
      if (rencanaIds.length === 0) return notice(s, "error", "Belum ada rencana disetujui untuk regu ini.")
      const id = `${a.reguKode}:${rencanaIds.join("+")}`
      const ada = s.pengiriman.find((p) => p.id === id)
      if (ada && ada.status === "DIBAGIKAN_MANUAL") return notice(s, "info", "Pesan versi ini sudah tercatat dibagikan. Tidak digandakan.")
      const kirim: Pengiriman = { id, reguKode: a.reguKode, isi: teks, status: "DIBAGIKAN_MANUAL", waktu: now(), buktiKanal: undefined, diakui: false }
      const pengiriman = [kirim, ...s.pengiriman.filter((p) => p.id !== id)]
      const tindakan = s.tindakan.map((t) => (rencanaIds.includes(t.rencanaId) && t.status === "DIBUAT" ? { ...t, status: "DISAMPAIKAN" as const } : t))
      const n = audit({ ...s, pengiriman, tindakan }, "BAGIKAN_INSTRUKSI", `${a.reguKode}: dibagikan manual lewat ${a.kanal} (tanpa bukti kanal otomatis)`)
      return notice(n, "ok", "Instruksi tercatat dibagikan. Menunggu pengakuan mandor di TERMA.")
    }
    case "TANDAI_GAGAL": {
      const k = s.pengiriman.find((p) => p.id === a.pengirimanId)
      if (!k) return notice(s, "error", "Pengiriman tidak ditemukan.")
      if (k.diakui) return notice(s, "error", "Pesan sudah diakui mandor.")
      const ids = k.id.split(":")[1].split("+")
      const pengiriman = s.pengiriman.map((p) => (p.id === k.id ? { ...p, status: "GAGAL" as const, buktiKanal: a.alasan } : p))
      const tindakan = s.tindakan.map((t) => (ids.includes(t.rencanaId) && t.status === "DISAMPAIKAN" ? { ...t, status: "DIBUAT" as const } : t))
      return notice(audit({ ...s, pengiriman, tindakan }, "GAGAL_DIBAGIKAN", `${k.reguKode}: ${a.alasan}`), "error", "Ditandai gagal. Tindakan kembali berstatus belum tersampaikan.")
    }
    case "AKUI": {
      const k = s.pengiriman.find((p) => p.id === a.pengirimanId)
      if (!k) return notice(s, "error", "Pengiriman tidak ditemukan.")
      if (k.status === "GAGAL") return notice(s, "error", "Pesan yang gagal dibagikan tidak bisa diakui.")
      if (k.diakui) return notice(s, "info", "Penerimaan sudah diakui.")
      const ids = k.id.split(":")[1].split("+")
      const pengiriman = s.pengiriman.map((p) => (p.id === k.id ? { ...p, diakui: true } : p))
      const tindakan = s.tindakan.map((t) => (ids.includes(t.rencanaId) && t.status === "DISAMPAIKAN" ? { ...t, status: "DIAKUI" as const } : t))
      return notice(audit({ ...s, pengiriman, tindakan }, "AKUI_PESAN", `${k.reguKode}: pesan diakui (belum berarti tindakan terlaksana)`), "ok", "Penerimaan diakui. Catat tindakannya.")
    }
    case "LAPOR": {
      const t = s.tindakan.find((x) => x.id === a.tindakanId)
      if (!t) return notice(s, "error", "Tindakan tidak ditemukan.")
      if (!["DIAKUI", "TINDAKAN_DILAPORKAN"].includes(t.status)) return notice(s, "error", "Tindakan belum diakui dari pesan.")
      if (!a.dijalankan && !a.alasan?.trim()) return notice(s, "error", "Alasan wajib diisi bila tindakan tidak dijalankan.")
      const tindakan = s.tindakan.map((x) =>
        x.id === t.id ? { ...x, status: "TINDAKAN_DILAPORKAN" as const, dijalankan: a.dijalankan, pelaksana: a.pelaksana, waktuTindakan: a.waktu, menitDilaporkan: a.menit, alasanTidakDijalankan: a.alasan } : x,
      )
      const n = audit({ ...s, tindakan }, "LAPOR_TINDAKAN", `${t.id}: ${a.dijalankan ? "dijalankan" : "tidak dijalankan · " + a.alasan} (${a.menit} menit paparan dilaporkan)`)
      return notice(n, "ok", t.status === "TINDAKAN_DILAPORKAN" ? "Laporan diperbarui (tidak digandakan)." : "Tindakan dilaporkan. Menunggu verifikasi HSE.")
    }
    case "VERIFIKASI": {
      const t = s.tindakan.find((x) => x.id === a.tindakanId)
      if (!t) return notice(s, "error", "Tindakan tidak ditemukan.")
      if (t.status !== "TINDAKAN_DILAPORKAN") return notice(s, "error", "Hanya tindakan yang sudah dilaporkan yang bisa diverifikasi.")
      const tindakan = s.tindakan.map((x) => (x.id === t.id ? { ...x, status: a.hasil, pemeriksa: aktor(s)!.nama, waktuVerifikasi: now(), menitDiverifikasi: a.menit } : x))
      return notice(audit({ ...s, tindakan }, "VERIFIKASI", `${t.id}: ${a.hasil}`), "ok", a.hasil === "TERVERIFIKASI" ? "Tindakan terverifikasi." : "Ditandai belum selesai.")
    }
  }
}

export function reducer(s: AppState, a: Action): AppState {
  const aksi = IZIN_AKSI[a.type]
  if (aksi) {
    const u = aktor(s)
    if (!u) return notice(s, "error", "Pilih pengguna dulu.")
    try {
      wajib(u, aksi, reguDari(s, a))
    } catch (e) {
      if (e instanceof AksesDitolak) return notice(audit(s, "AKSES_DITOLAK", `${a.type}: ${e.message}`), "error", `Akses ditolak: ${e.message}`)
      throw e
    }
  }
  return inner(s, a)
}

/** Run synthetic inputs through the same validation, rule engine, and lifecycle as user actions. */
function muatDemo(awal: AppState): AppState {
  const csv = dataDemo(awal.tanggal)
  let s: AppState = { ...awal, demo: { versi: DEMO_VERSION, tanggal: awal.tanggal } }
  const run = (action: Action) => { s = reducer(s, action) }
  run({ type: "IMPOR_PEKERJA", csv: csv.pekerja, source: "demo-pekerja.csv (sintetis)" })
  s = { ...s, pekerja: s.pekerja.map((p) => ({ ...p, origin: "SINTETIS" })) }
  run({ type: "IMPOR_KEHADIRAN", csv: csv.kehadiran, source: "demo-kehadiran.csv (sintetis)" })
  run({ type: "IMPOR_PENGUKURAN", csv: csv.pengukuran, source: "demo-wbgt.csv (replay sintetis)" })
  run({ type: "IMPOR_PRAKIRAAN", csv: csv.prakiraan, source: "demo-prakiraan.csv (bukan BMKG aktual)" })
  run({ type: "KONFIRMASI", pekerjaKode: "DEMO001", profil: "PEKERJA_BARU", hari: 1 })
  run({ type: "KONFIRMASI", pekerjaKode: "DEMO003", profil: "BERPENGALAMAN_KEMBALI", hari: 1 })
  run({ type: "HITUNG_RENCANA" })
  for (const kode of ["DEMO001", "DEMO003", "DEMO006", "DEMO007", "DEMO008"]) {
    run({ type: "SETUJUI", rencanaId: `${kode}-v1@${s.tanggal}` })
  }
  run({ type: "BAGIKAN", reguKode: "COR", kanal: "simulasi lokal (tidak ada pesan dikirim)" })
  run({ type: "BAGIKAN", reguKode: "BEK", kanal: "simulasi lokal (tidak ada pesan dikirim)" })
  run({ type: "LOGIN", userId: "mandor-budi" })
  run({ type: "AKUI", pengirimanId: s.pengiriman.find((p) => p.reguKode === "COR")!.id })
  const id = (kode: string) => s.tindakan.find((t) => t.pekerjaKode === kode)!.id
  run({ type: "LAPOR", tindakanId: id("DEMO001"), dijalankan: true, pelaksana: "Budi (simulasi)", waktu: "09:30", menit: 80 })
  run({ type: "LAPOR", tindakanId: id("DEMO003"), dijalankan: true, pelaksana: "Budi (simulasi)", waktu: "12:00", menit: 220 })
  run({ type: "LOGIN", userId: awal.sesi!.userId })
  run({ type: "VERIFIKASI", tindakanId: id("DEMO001"), hasil: "TERVERIFIKASI", menit: 75 })
  // Preserve the original session and explicitly label simulated decisions on detail pages.
  s = {
    ...s,
    sesi: awal.sesi,
    konfirmasi: s.konfirmasi.map((k) => ({ ...k, dikonfirmasiOleh: `${k.dikonfirmasiOleh} (simulasi)` })),
    rencana: s.rencana.map((r) => r.disetujuiOleh ? { ...r, disetujuiOleh: `${r.disetujuiOleh} (simulasi)` } : r),
    tindakan: s.tindakan.map((t) => t.pemeriksa ? { ...t, pemeriksa: `${t.pemeriksa} (simulasi)` } : t),
  }
  return notice(audit(s, "MUAT_DEMO", `${DEMO_VERSION}: 8 pekerja dan contoh alur untuk ${s.tanggal}. Tidak ada pengiriman eksternal.`), "ok", "Data demo dimuat. Semua data dan aktivitas adalah simulasi, bukan catatan operasional.")
}

// ---------------------------------------------------------------- provider (local persistence until the API exists)

// Isolated mock workspace: never read or overwrite the previous terma-v1 dataset.
export const DEMO_STORAGE_KEY = "terma-demo-v2"
export function initialDemoState(tanggal = hariIni()) {
  return { ...reducer(stateAwal(tanggal), { type: "MUAT_DEMO" }), notice: undefined }
}
export function readDemoState(raw: string): AppState {
  const parsed = JSON.parse(raw) as AppState
  if (!parsed.demo || !tanggalValid(parsed.tanggal) || !userById(parsed.sesi?.userId)) throw new Error("Invalid demo workspace")
  for (const key of ["pekerja", "kehadiran", "penugasan", "konfirmasi", "bacaan", "prakiraan", "rencana", "tindakan", "pengiriman", "imporLog", "audit"] as const) {
    if (!Array.isArray(parsed[key]) || parsed[key].some(item => !item || typeof item !== "object")) throw new Error("Invalid demo collection")
  }
  return { ...parsed, notice: undefined }
}
const Ctx = createContext<{ state: AppState; dispatch: (a: Action) => void; user: User | null; ready: boolean; storageError: string; retryStorage: () => void } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => stateAwal())
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState("")
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [saveAttempt, setSaveAttempt] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY)
      dispatch({ type: "HYDRATE", state: raw ? readDemoState(raw) : initialDemoState() })
    } catch {
      // Keep unreadable data intact. The temporary demo remains usable without overwriting it.
      dispatch({ type: "HYDRATE", state: initialDemoState() })
      setStorageBlocked(true)
      setStorageError("Data demo tersimpan tidak dapat dibaca. Anda sedang memakai demo sementara; perubahan belum disimpan. Data lama tidak ditimpa. Coba jendela privat untuk ruang demo baru.")
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || storageBlocked) return
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ ...state, notice: undefined }))
      setStorageError("")
    } catch {
      setStorageError("Perubahan belum tersimpan di browser. Izinkan penyimpanan situs atau kosongkan ruang perangkat, lalu coba simpan lagi. Jangan tutup halaman sebelum tersimpan.")
    }
  }, [state, ready, storageBlocked, saveAttempt])

  const value = useMemo(() => ({ state, dispatch, user: userById(state.sesi?.userId), ready, storageError, retryStorage: () => {
    if (storageBlocked) {
      try {
        const raw = localStorage.getItem(DEMO_STORAGE_KEY)
        if (raw) readDemoState(raw)
        setStorageError("Data tersimpan dilindungi. Buka jendela privat untuk demo baru, atau muat ulang halaman setelah masalah penyimpanan diperbaiki.")
      } catch { setStorageError("Penyimpanan masih tidak dapat dibaca. Gunakan jendela privat; data lama tetap tidak ditimpa.") }
    } else setSaveAttempt(n => n + 1)
  } }), [state, ready, storageError, storageBlocked])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useApp must be used inside AppProvider")
  return v
}

/** UI permission check. Mirrors the reducer's check so buttons are disabled instead of failing. */
export function useIzin() {
  const { user } = useApp()
  return (aksi: Aksi, reguKode?: string) => !!user && boleh(user, aksi, reguKode)
}

import { JAM_SHIFT, REGU, TUGAS, ZONA, awalInterval } from "./config"
import { now, audit, notice, angka, tanggalValid } from "./store-utils"
import type { AppState } from "./store-state"
import type { ImportResult, ImportRowResult, Pekerja, Penugasan, Kehadiran, PengukuranWBGT, PrakiraanCuaca } from "./types"

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

export function imporPekerja(s: AppState, csv: string, source: string): AppState {
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

export function imporKehadiran(s: AppState, csv: string, source: string): AppState {
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

export function imporPengukuran(s: AppState, csv: string, source: string): AppState {
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

export function imporPrakiraan(s: AppState, csv: string, source: string): AppState {
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

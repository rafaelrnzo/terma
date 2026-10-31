import { isManagementAction, currentShift, checkpointShift, ensureManagement, isClosedShift, mutableShiftAction, managementOf } from "./management-state"
import { manageWorker } from "./worker-management"
import { shiftActionError } from "./shift-action-validation"
import { manageShift, openShift } from "./shift-management"
import { AksesDitolak, wajib, type Aksi } from "./access"
import { ATURAN_FIXTURE } from "./config"
import { namaZona, rentangJam } from "./rules"
import { bisaMuatDemo, dataDemo, DEMO_VERSION } from "./seed-data"
import { aktor, userById, audit, notice, now, tanggalValid } from "./store-utils"
import { recompute, rencanaAktif, isiPesan, deskripsiTindakan } from "./store-plans"
import { imporPekerja, imporKehadiran, imporPengukuran, imporPrakiraan } from "./store-imports"
import type { AppState, Action } from "./store-state"
import type { KonfirmasiPaparan, PengukuranWBGT, Tindakan, Pengiriman } from "./types"

const IZIN_AKSI: Partial<Record<Action["type"], Aksi>> = {
  MUAT_DEMO: "MUAT_DEMO",
  SIMPAN_PEKERJA: "KELOLA_PEKERJA",
  HAPUS_PEKERJA: "KELOLA_PEKERJA",
  ARSIP_PEKERJA: "KELOLA_PEKERJA",
  BUAT_SHIFT: "KELOLA_SHIFT",
  UBAH_SHIFT: "KELOLA_SHIFT",
  HAPUS_SHIFT: "KELOLA_SHIFT",
  TERBITKAN_SHIFT: "KELOLA_SHIFT",
  TUTUP_SHIFT: "KELOLA_SHIFT",
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

function inner(s: AppState, a: Exclude<Action, import("./management-types").ManagementAction>): AppState {
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
      if (!["DIAKUI", "TINDAKAN_DILAPORKAN", "BELUM_SELESAI"].includes(t.status)) return notice(s, "error", "Tindakan belum diakui dari pesan.")
      if (!a.dijalankan && !a.alasan?.trim()) return notice(s, "error", "Alasan wajib diisi bila tindakan tidak dijalankan.")
      const tindakan = s.tindakan.map((x) =>
        x.id === t.id ? { ...x, status: "TINDAKAN_DILAPORKAN" as const, dijalankan: a.dijalankan, pelaksana: a.pelaksana, waktuTindakan: a.waktu, menitDilaporkan: a.menit, alasanTidakDijalankan: a.alasan, pemeriksa: undefined, waktuVerifikasi: undefined, menitDiverifikasi: undefined } : x,
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
  if (isManagementAction(a)) {
    if (a.type === "SIMPAN_PEKERJA" || a.type === "HAPUS_PEKERJA" || a.type === "ARSIP_PEKERJA") return manageWorker(s, a)
    return manageShift(s, a)
  }
  if (s.management && a.type === "SET_TANGGAL") return openShift(s, a.tanggal)
  if (s.management && a.type === "IMPOR_PEKERJA") {
    const management = managementOf(s)
    const imported = imporPekerja({ ...s, pekerja: management.workers, penugasan: management.assignments }, a.csv, a.source)
    return { ...imported, pekerja: s.pekerja, penugasan: s.penugasan, management: { ...management, workers: imported.pekerja, assignments: imported.penugasan } }
  }
  if (isClosedShift(s) && mutableShiftAction(a)) return notice(s, "error", "Shift sudah ditutup dan hanya dapat dibaca. Buat shift baru untuk pekerjaan berikutnya.")
  if (currentShift(s)?.status === "DRAFT" && (a.type === "BAGIKAN" || a.type === "AKUI" || a.type === "LAPOR" || a.type === "VERIFIKASI")) return notice(s, "error", "Terbitkan shift setelah rencana disetujui, lalu lanjutkan pelaksanaan.")
  if (s.management && mutableShiftAction(a) && a.type !== "MUAT_DEMO" && !currentShift(s)) return notice(s, "error", "Buat atau buka shift terlebih dahulu sebelum mencatat data operasional.")
  const invalid = shiftActionError(s, a)
  if (invalid) return notice(s, "error", invalid)
  const next = inner(s, a)
  return a.type === "MUAT_DEMO" && s.management ? ensureManagement(next) : checkpointShift(next)
}

/** Run synthetic inputs through the same validation, rule engine, and lifecycle as user actions. */
function muatDemo(awal: AppState): AppState {
  const csv = dataDemo(awal.tanggal)
  let s: AppState = { ...awal, demo: { versi: DEMO_VERSION, tanggal: awal.tanggal } }
  delete s.management
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

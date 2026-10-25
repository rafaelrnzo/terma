import { describe, expect, it } from "vitest"
import { bisaMuatDemo, dataDemo, DEMO_VERSION } from "./seed-data"
import { isiPesan, reducer, rencanaAktif, stateAwal, type AppState } from "./store"

const seed = (tanggal = "2026-10-25") => reducer(stateAwal(tanggal), { type: "MUAT_DEMO" })

describe("demo seed", () => {
  it("populates validated inputs and a usable end-to-end demo", () => {
    const s = seed()
    expect(s.notice?.tipe).toBe("ok")
    expect(s.demo).toEqual({ versi: DEMO_VERSION, tanggal: s.tanggal })
    expect(s.pekerja).toHaveLength(8)
    expect(s.penugasan).toHaveLength(8)
    expect(s.kehadiran).toHaveLength(92)
    expect(s.bacaan).toHaveLength(16)
    expect(s.prakiraan).toHaveLength(3)
    expect(s.konfirmasi).toHaveLength(2)
    expect(rencanaAktif(s)).toHaveLength(8)
    expect(s.imporLog).toHaveLength(4)
    expect(s.imporLog.every((l) => l.ditolak.length === 0)).toBe(true)
    expect(s.audit.some((a) => a.aksi === "AKSES_DITOLAK")).toBe(false)
    expect(s.sesi?.userId).toBe("hse-ratna")
  })

  it("shows all four decision statuses without disguising synthetic readings as actual", () => {
    const s = seed()
    const statuses = Object.fromEntries(rencanaAktif(s).map((r) => [r.pekerjaKode, r.status]))
    expect(statuses).toEqual({
      DEMO001: "ADAPTASI_DIPERLUKAN", DEMO002: "BATASI_ATAU_PINDAHKAN", DEMO003: "ADAPTASI_DIPERLUKAN",
      DEMO004: "TINJAU_HSE", DEMO005: "TINJAU_HSE", DEMO006: "RENCANA_TERSEDIA",
      DEMO007: "RENCANA_TERSEDIA", DEMO008: "RENCANA_TERSEDIA",
    })
    expect(s.pekerja.every((p) => p.origin === "SINTETIS" && p.nama.includes("demo"))).toBe(true)
    expect(s.bacaan.every((b) => b.origin === "REPLAY")).toBe(true)
    expect(s.rencana.every((r) => r.kualitas !== "TERUKUR")).toBe(true)
    expect(s.prakiraan.every((p) => p.lokasi.includes("SIMULASI"))).toBe(true)
    expect(s.rencana.find((r) => r.pekerjaKode === "DEMO004")?.kualitas).toBe("PRAKIRAAN_SAJA")
    expect(s.rencana.find((r) => r.pekerjaKode === "DEMO001")?.batasHarianMenit).toBe(96)
    expect(s.rencana.find((r) => r.pekerjaKode === "DEMO003")?.batasHarianMenit).toBe(240)
  })

  it("includes clearly labelled simulated delivery, acknowledgement, reporting and verification", () => {
    const s = seed()
    expect(s.pengiriman).toHaveLength(2)
    expect(s.pengiriman.every((p) => p.status === "DIBAGIKAN_MANUAL" && p.isi.startsWith("DATA DEMO / SIMULASI"))).toBe(true)
    expect(isiPesan(s, "COR").teks).toContain("bukan instruksi operasional")
    expect(s.audit.every((a) => a.detail.startsWith("[SIMULASI]"))).toBe(true)
    expect(s.tindakan).toHaveLength(5)
    expect(new Set(s.tindakan.map((t) => t.status))).toEqual(new Set(["TERVERIFIKASI", "TINDAKAN_DILAPORKAN", "DIAKUI", "DISAMPAIKAN"]))
    const t = s.tindakan.find((t) => t.pekerjaKode === "DEMO001")!
    expect([t.menitDirencanakan, t.menitDilaporkan, t.menitDiverifikasi]).toEqual([96, 80, 75])
    expect(t.pemeriksa).toContain("simulasi")
  })

  it.each(["2026-10-25", "2027-01-01", "2028-03-01"])("shifts dates and attendance to %s", (tanggal) => {
    const s = seed(tanggal)
    expect(s.bacaan.every((b) => b.tanggal === tanggal && b.waktuCatat.startsWith(tanggal))).toBe(true)
    expect(s.rencana.every((r) => r.tanggal === tanggal)).toBe(true)
    expect(s.prakiraan.every((p) => p.tanggal === tanggal)).toBe(true)
    expect(s.kehadiran.every((k) => k.tanggal < tanggal)).toBe(true)
    expect(new Set(s.kehadiran.map((k) => k.tanggal)).size).toBe(14)
    expect(s.rencana.find((r) => r.pekerjaKode === "DEMO003")?.status).toBe("ADAPTASI_DIPERLUKAN")
  })

  it("does not duplicate or reset an already modified demo", () => {
    let s = seed()
    s = reducer(s, { type: "UBAH_PENUGASAN", pekerjaKode: "DEMO007", tugasKode: "PEMERIKSAAN", zonaKode: "COR_B" })
    const repeated = reducer(s, { type: "MUAT_DEMO" })
    expect({ ...repeated, notice: undefined }).toEqual({ ...s, notice: undefined })
    expect(repeated.notice?.pesan).toContain("Tidak ada data yang ditimpa")
  })

  it.each(["pekerja", "penugasan", "kehadiran", "konfirmasi", "bacaan", "prakiraan", "rencana", "tindakan", "pengiriman", "imporLog"] as const)("preserves existing %s even if other collections are empty", (key) => {
    const fixture = seed()
    const s: AppState = { ...stateAwal(), [key]: fixture[key] }
    expect(bisaMuatDemo(s)).toBe(false)
    const result = reducer(s, { type: "MUAT_DEMO" })
    expect({ ...result, notice: undefined }).toEqual({ ...s, notice: undefined })
    expect(result.demo).toBeUndefined()
  })

  it.each(["mandor-budi", "mandor-sari", "data-tono"])("rejects seed from %s at the data layer", (userId) => {
    const s = reducer(reducer(stateAwal(), { type: "LOGIN", userId }), { type: "MUAT_DEMO" })
    expect(s.pekerja).toHaveLength(0)
    expect(s.demo).toBeUndefined()
    expect(s.notice?.tipe).toBe("error")
  })

  it("rejects anonymous or invalid-date requests and keeps prior audit entries", () => {
    expect(reducer({ ...stateAwal(), sesi: null }, { type: "MUAT_DEMO" }).notice?.tipe).toBe("error")
    expect(() => dataDemo("2026-02-30")).toThrow("Tanggal seed tidak valid")
    expect(reducer(stateAwal("2026-02-30"), { type: "MUAT_DEMO" }).demo).toBeUndefined()
    const initial = stateAwal()
    initial.audit.push({ waktu: "2026-10-25T00:00:00Z", aktor: "Ratna", aksi: "LAMA", detail: "Audit sebelum seed" })
    expect(reducer(initial, { type: "MUAT_DEMO" }).audit).toContainEqual(initial.audit[0])
  })
})

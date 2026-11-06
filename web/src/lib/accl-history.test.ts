import { describe, expect, it } from "vitest"
import { acclHistorySuggestion } from "./accl-history"
import { emptyWorkspaceState, reducer } from "./store"

function prepared() {
  let state = emptyWorkspaceState("2026-11-05")
  state = reducer(state, { type: "SIMPAN_PEKERJA", input: { kode: "W01", nama: "Adi", reguKode: "COR", tanggalMulai: "2026-11-05", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
  state = reducer(state, { type: "BUAT_SHIFT", tanggal: "2026-11-05", nama: "Hari pertama", workerCodes: ["W01"] })
  return reducer(state, { type: "KONFIRMASI", pekerjaKode: "W01", profil: "PEKERJA_BARU", hari: 1 })
}

describe("acclimatisation attendance history", () => {
  it("does not advance adaptation from selection and confirmation alone", () => {
    const next = reducer(prepared(), { type: "BUAT_SHIFT", tanggal: "2026-11-06", nama: "Hari berikutnya", workerCodes: ["W01"] })
    expect(acclHistorySuggestion(next, "W01")).toMatchObject({ day: 1, previousDate: "2026-11-05" })
    expect(acclHistorySuggestion(next, "UNKNOWN")).toBeNull()
  })

  it("advances a confirmed adaptation day after actual check-in", () => {
    const attended = reducer(prepared(), { type: "CATAT_CHECKIN", persetujuan: true, pekerjaKode: "W01", kondisi: "BAIK", keluhan: [] })
    const next = reducer(attended, { type: "BUAT_SHIFT", tanggal: "2026-11-06", nama: "Hari berikutnya", workerCodes: ["W01"] })
    expect(acclHistorySuggestion(next, "W01")).toMatchObject({ day: 2, previousDate: "2026-11-05" })
  })
})

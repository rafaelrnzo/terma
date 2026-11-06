import { managementOf } from "./management-state"
import { now } from "./store-utils"
import type { AppState } from "./store-state"
import type { Pekerja, Penugasan } from "./types"
import type { HealthBaseline } from "./worker-readiness"

export interface CompanySync { source: "LOCAL_ADAPTER" | "WORKSPACE"; syncedAt: string }

function dateOffset(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

/** Reference company connector. No external HRIS/MCU request or clinical measurement is implied. */
export function syncCompanyData(state: AppState): AppState {
  const management = managementOf(state)
  if (management.workers.length || management.shifts.length) return { ...state, management: { ...management, companySync: { source: management.companySync?.source ?? "WORKSPACE", syncedAt: now() } } }
  const people = [
    ["CMP001", "Andi Saputra", "COR", "PEMERIKSAAN", "GUDANG", 0],
    ["CMP002", "Rudi Hartono", "COR", "PENGECORAN", "COR_B", -720],
    ["CMP003", "Dedi Pratama", "COR", "PEMBESIAN", "COR_B", -400],
    ["CMP004", "Hadi Santoso", "COR", "ANGKUT", "GUDANG", -180],
    ["CMP005", "Eko Wibowo", "BEK", "BEKISTING", "BEK_A", -300],
    ["CMP006", "Fajar Nugroho", "BEK", "PENGELASAN", "BEK_A", -500],
    ["CMP007", "Gita Lestari", "BEK", "PEMERIKSAAN", "GUDANG", -100],
    ["CMP008", "Bima Putra", "BEK", "PEMERIKSAAN", "GUDANG", 0],
  ] satisfies [string, string, string, string, string, number][]
  const workers: Pekerja[] = people.map(([kode, nama, reguKode, , , days]) => ({ kode, nama, reguKode, tanggalMulai: dateOffset(state.tanggal, days), source: "Company Data Hub · referensi lokal", origin: "SINTETIS", revision: 1, diarsipkan: false }))
  const assignments: Penugasan[] = people.map(([pekerjaKode, , , tugasKode, zonaKode]) => ({ pekerjaKode, tugasKode, zonaKode, apd: "Standar", apdBerubah: false, version: 1 }))
  const healthBaselines: HealthBaseline[] = workers.map(worker => ({ pekerjaKode: worker.kode, tanggalPemeriksaan: dateOffset(state.tanggal, -30), berlakuSampai: dateOffset(state.tanggal, 335), status: "PERLU_TINJAU", pembatasan: "Ringkasan referensi perusahaan. HSE perlu meninjau dokumen pemeriksaan dan kondisi awal sebelum penugasan.", sumber: `Company Data Hub · referensi lokal / ${worker.kode}`, dicatatOleh: "Company Data Hub", dicatatPada: now() }))
  return { ...state, management: { ...management, workers, assignments, healthBaselines, companySync: { source: "LOCAL_ADAPTER", syncedAt: now() } } }
}

import { REGU, TUGAS, ZONA } from "./config"
import { managementOf } from "./management-state"
import { audit, notice, tanggalValid } from "./store-utils"
import type { AppState } from "./store-state"
import type { ManagementAction, WorkerInput } from "./management-types"

export function workerInputError(input: WorkerInput) {
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(input.kode)) return "ID pekerja harus 2–32 huruf, angka, tanda hubung, atau garis bawah."
  if (input.nama.trim().length < 2) return "Nama pekerja minimal 2 karakter."
  if (!tanggalValid(input.tanggalMulai)) return "Tanggal mulai tidak valid."
  if (!REGU.some(item => item.kode === input.reguKode)) return "Pilih regu yang tersedia."
  if (!TUGAS.some(item => item.kode === input.tugasKode)) return "Pilih tugas yang tersedia."
  if (!ZONA.some(item => item.kode === input.zonaKode)) return "Pilih zona yang tersedia."
  if (!input.apd.trim()) return "APD wajib diisi."
  return ""
}

export function workerUsage(s: AppState, kode: string) {
  const management = managementOf(s)
  return management.shifts.filter(shift => shift.workspace.pekerja.some(worker => worker.kode === kode)).length
}

export function manageWorker(s: AppState, a: Extract<ManagementAction, { type: "SIMPAN_PEKERJA" | "HAPUS_PEKERJA" | "ARSIP_PEKERJA" }>): AppState {
  const management = managementOf(s)
  if (a.type === "SIMPAN_PEKERJA") {
    const invalid = workerInputError(a.input)
    if (invalid) return notice(s, "error", invalid)
    const old = a.previousCode ? management.workers.find(worker => worker.kode === a.previousCode) : undefined
    if (a.previousCode && !old) return notice(s, "error", "Pekerja yang akan diubah tidak ditemukan.")
    if (old && ((old.revision ?? 1) !== a.expectedRevision || old.kode !== a.input.kode)) return notice(s, "error", "Data pekerja sudah berubah atau ID diganti. Buka ulang formulir.")
    if (!old && management.workers.some(worker => worker.kode === a.input.kode)) return notice(s, "error", "ID pekerja sudah digunakan.")
    const worker = { kode: a.input.kode, nama: a.input.nama.trim(), reguKode: a.input.reguKode, tanggalMulai: a.input.tanggalMulai, source: "Formulir pekerja", origin: "MANUAL", revision: (old?.revision ?? 0) + 1, diarsipkan: old?.diarsipkan ?? false } satisfies AppState["pekerja"][number]
    const assignment = { pekerjaKode: worker.kode, tugasKode: a.input.tugasKode, zonaKode: a.input.zonaKode, apd: a.input.apd.trim(), apdBerubah: a.input.apd !== "Standar", version: (management.assignments.find(item => item.pekerjaKode === worker.kode)?.version ?? 0) + 1 }
    const next = { ...s, management: { ...management, workers: old ? management.workers.map(item => item.kode === old.kode ? worker : item) : [...management.workers, worker], assignments: [...management.assignments.filter(item => item.pekerjaKode !== worker.kode), assignment] } }
    return notice(audit(next, old ? "UBAH_PEKERJA" : "TAMBAH_PEKERJA", `${worker.kode}: ${worker.nama}. Perubahan master berlaku pada shift baru; snapshot shift terdahulu dipertahankan.`), "ok", old ? "Data pekerja diperbarui. Shift yang sudah dibuat tetap menggunakan snapshot sebelumnya." : "Pekerja ditambahkan. Selanjutnya pilih pekerja ini saat membuat shift.")
  }
  const worker = management.workers.find(item => item.kode === a.kode)
  if (!worker) return notice(s, "error", "Pekerja tidak ditemukan.")
  if ((worker.revision ?? 1) !== a.expectedRevision) return notice(s, "error", "Data pekerja sudah berubah. Buka ulang daftar.")
  if (a.type === "HAPUS_PEKERJA") {
    if (workerUsage(s, worker.kode) || s.rencana.some(plan => plan.pekerjaKode === worker.kode)) return notice(s, "error", "Pekerja sudah memiliki riwayat shift. Arsipkan pekerja untuk menyimpan riwayatnya.")
    const next = { ...s, management: { ...management, workers: management.workers.filter(item => item.kode !== worker.kode), assignments: management.assignments.filter(item => item.pekerjaKode !== worker.kode) } }
    return notice(audit(next, "HAPUS_PEKERJA", `${worker.kode}: data master tanpa riwayat dihapus.`), "ok", "Pekerja dihapus dari master.")
  }
  const next = { ...s, management: { ...management, workers: management.workers.map(item => item.kode === worker.kode ? { ...item, diarsipkan: a.archived, revision: (item.revision ?? 1) + 1 } : item) } }
  return notice(audit(next, "ARSIP_PEKERJA", `${worker.kode}: ${a.archived ? "diarsipkan dari pilihan shift baru" : "diaktifkan kembali"}; riwayat shift dipertahankan.`), "ok", a.archived ? "Pekerja diarsipkan. Riwayat shift tetap tersimpan." : "Pekerja aktif kembali.")
}

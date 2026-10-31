import { managementOf, checkpointShift, workspaceSnapshot } from "./management-state"
import { workflow } from "./workflow"
import { audit, notice, now, tanggalValid, aktor } from "./store-utils"
import type { AppState } from "./store-state"
import type { ManagementAction, ShiftRecord, ShiftWorkspace } from "./management-types"

function shiftWorkspace(s: AppState, tanggal: string, workerCodes: string[]): ShiftWorkspace {
  const management = managementOf(s)
  const selected = new Set(workerCodes)
  const histories = new Map(management.shifts.flatMap(shift => shift.workspace.kehadiran).concat(s.kehadiran).map(row => [`${row.pekerjaKode}:${row.tanggal}`, row]))
  const kehadiran = [...histories.values()].filter(row => selected.has(row.pekerjaKode) && row.tanggal < tanggal)
  return {
    pekerja: management.workers.filter(worker => selected.has(worker.kode)).map(worker => ({ ...worker })),
    penugasan: management.assignments.filter(assignment => selected.has(assignment.pekerjaKode)).map(assignment => ({ ...assignment })),
    kehadiran: [...kehadiran, ...workerCodes.map(pekerjaKode => ({ pekerjaKode, tanggal, status: "HADIR" as const, source: "Peserta dipilih saat membuat shift" }))],
    konfirmasi: [], bacaan: [], prakiraan: [], rencana: [], rencanaDihitung: false, tindakan: [], pengiriman: [],
  }
}

function participantsError(s: AppState, tanggal: string, codes: string[]) {
  if (!codes.length) return "Pilih minimal satu pekerja untuk shift ini."
  if (new Set(codes).size !== codes.length) return "Peserta shift tidak boleh duplikat."
  const management = managementOf(s)
  for (const code of codes) {
    const worker = management.workers.find(item => item.kode === code)
    if (!worker || worker.diarsipkan || worker.tanggalMulai > tanggal) return "Peserta tidak tersedia, diarsipkan, atau belum mulai bekerja pada tanggal shift."
    if (!management.assignments.some(item => item.pekerjaKode === code)) return "Setiap peserta harus memiliki penugasan awal."
  }
  return ""
}

export function openShift(s: AppState, shiftId: string): AppState {
  const user = aktor(s)
  if (!user) return notice(s, "error", "Pilih pengguna terlebih dahulu.")
  const saved = checkpointShift(s)
  const management = managementOf(saved)
  const shift = management.shifts.find(item => item.id === shiftId)
  if (!shift) return notice(s, "error", "Shift tidak ditemukan. Buat shift terlebih dahulu.")
  if (user.role === "MANDOR" && !shift.workspace.pekerja.some(worker => worker.reguKode === user.reguKode)) return notice(s, "error", "Shift ini tidak memuat regu Anda.")
  if (management.activeId === shift.id) return s
  return audit({ ...saved, ...shift.workspace, tanggal: shift.tanggal, management: { ...management, activeId: shift.id } }, "BUKA_SHIFT", `${shift.id}: ${shift.nama}`)
}

export function manageShift(s: AppState, a: Exclude<ManagementAction, { type: "SIMPAN_PEKERJA" | "HAPUS_PEKERJA" | "ARSIP_PEKERJA" }>): AppState {
  if (a.type === "BUKA_SHIFT") return openShift(s, a.shiftId)
  const user = aktor(s)
  if (!user) return notice(s, "error", "Pilih pengguna terlebih dahulu.")
  const saved = checkpointShift(s)
  const management = managementOf(saved)
  if (a.type === "BUAT_SHIFT") {
    if (!tanggalValid(a.tanggal)) return notice(s, "error", "Tanggal shift tidak valid.")
    if (a.nama.trim().length < 3) return notice(s, "error", "Nama shift minimal 3 karakter.")
    if (management.shifts.some(shift => shift.tanggal === a.tanggal)) return notice(s, "error", "Sudah ada shift pada tanggal ini. Buka shift yang sudah dibuat.")
    const invalid = participantsError(s, a.tanggal, a.workerCodes)
    if (invalid) return notice(s, "error", invalid)
    const workspace = shiftWorkspace(saved, a.tanggal, a.workerCodes)
    const shift: ShiftRecord = { id: a.tanggal, tanggal: a.tanggal, nama: a.nama.trim(), status: "DRAFT", dibuatOleh: user.nama, dibuatPada: now(), workspace }
    const next = { ...saved, ...workspace, tanggal: a.tanggal, management: { ...management, activeId: shift.id, shifts: [...management.shifts, shift] } }
    return notice(audit(next, "BUAT_SHIFT", `${shift.id}: ${shift.nama}, ${workspace.pekerja.length} peserta. Snapshot master disimpan.`), "ok", "Draft shift dibuat. Mulai dari persiapan pekerja dan bacaan panas.")
  }
  const shift = management.shifts.find(item => item.id === a.shiftId)
  if (!shift) return notice(s, "error", "Shift tidak ditemukan.")
  const issued = shift.workspace.rencana.some(plan => plan.disetujuiOleh) || shift.workspace.tindakan.length > 0
  if (a.type === "HAPUS_SHIFT" || a.type === "UBAH_SHIFT") {
    if (shift.status !== "DRAFT" || issued) return notice(s, "error", "Peserta dan draft hanya dapat diubah atau dihapus sebelum ada persetujuan dan tindakan.")
    if (a.type === "HAPUS_SHIFT") {
      const workspace: ShiftWorkspace = { pekerja: [], penugasan: [], kehadiran: [], konfirmasi: [], bacaan: [], prakiraan: [], rencana: [], rencanaDihitung: false, tindakan: [], pengiriman: [] }
      const active = management.activeId === shift.id
      const next = { ...saved, ...(active ? workspace : workspaceSnapshot(saved)), management: { ...management, activeId: active ? null : management.activeId, shifts: management.shifts.filter(item => item.id !== shift.id) } }
      return notice(audit(next, "HAPUS_DRAFT_SHIFT", `${shift.id}: draft tanpa persetujuan dihapus.`), "ok", "Draft shift dihapus. Master pekerja tetap tersimpan.")
    }
    if (a.nama.trim().length < 3) return notice(s, "error", "Nama shift minimal 3 karakter.")
    const invalid = participantsError(s, shift.tanggal, a.workerCodes)
    if (invalid) return notice(s, "error", invalid)
    const workspace = { ...shiftWorkspace(saved, shift.tanggal, a.workerCodes), bacaan: shift.workspace.bacaan, prakiraan: shift.workspace.prakiraan }
    const shifts = management.shifts.map(item => item.id === shift.id ? { ...item, nama: a.nama.trim(), workspace } : item)
    const next = { ...saved, ...(management.activeId === shift.id ? workspace : workspaceSnapshot(saved)), management: { ...management, shifts } }
    return notice(audit(next, "UBAH_DRAFT_SHIFT", `${shift.id}: peserta dan nama draft diperbarui. Rencana draft perlu dihitung ulang.`), "ok", "Draft diperbarui. Periksa penugasan dan hitung ulang rencana.")
  }
  if (management.activeId !== shift.id) return notice(s, "error", "Buka shift yang akan diproses terlebih dahulu.")
  const steps = workflow(s, user)
  if (a.type === "TERBITKAN_SHIFT") {
    if (shift.status !== "DRAFT") return notice(s, "error", "Hanya draft yang dapat diterbitkan.")
    if (!steps[3].selesai) return notice(s, "error", "Hitung dan setujui seluruh rencana peserta sebelum menerbitkan shift.")
    const next = { ...saved, management: { ...management, shifts: management.shifts.map(item => item.id === shift.id ? { ...item, status: "ACTIVE" as const, diterbitkanPada: now() } : item) } }
    return notice(audit(next, "TERBITKAN_SHIFT", `${shift.id}: rencana disetujui, siap dibagikan kepada mandor.`), "ok", "Shift diterbitkan. Selanjutnya bagikan instruksi kepada mandor.")
  }
  if (shift.status !== "ACTIVE") return notice(s, "error", "Hanya shift berjalan yang dapat ditutup.")
  if (!steps[5].selesai) return notice(s, "error", "Shift belum dapat ditutup: seluruh rencana aktif harus disetujui dan semua tindakannya terverifikasi.")
  const next = { ...saved, management: { ...management, shifts: management.shifts.map(item => item.id === shift.id ? { ...item, status: "CLOSED" as const, ditutupPada: now(), ditutupOleh: user.nama } : item) } }
  return notice(audit(next, "TUTUP_SHIFT", `${shift.id}: ditutup oleh ${user.nama}; snapshot dan laporan menjadi hanya-baca.`), "ok", "Shift selesai dan ditutup. Laporan akhir dapat dibuka atau dicetak.")
}

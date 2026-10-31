import { currentShift, managementOf } from "./management-state"
import { shiftJourney } from "./shift-journey"
import { workflow } from "./workflow"
import type { AppState } from "./store-state"
import type { User } from "./types"

export function managedJourney(s: AppState, user: User) {
  const legacy = shiftJourney(s, user)
  const shift = currentShift(s)
  const hub = shift ? `/shift/${shift.id}` : "/ringkasan"
  let focus = legacy.focus
  let command: "TERBITKAN_SHIFT" | "TUTUP_SHIFT" | undefined
  if (!shift) {
    const workers = managementOf(s).workers.some(worker => !worker.diarsipkan)
    focus = { ...focus, state: "action", owner: workers ? "HSE" : "PETUGAS_DATA", title: workers ? "Buat draft shift pertama" : "Tambahkan pekerja terlebih dahulu", description: workers ? "Pilih tanggal dan peserta. Setelah draft dibuat, semua pekerjaan berlangsung di dalam shift tersebut." : "Isi identitas, regu, dan penugasan awal. Selanjutnya buat shift dan pilih peserta yang hadir.", cta: workers ? "Buat shift" : "Kelola pekerja", href: workers ? "/ringkasan?buat=1" : "/impor" }
  } else if (shift.status === "CLOSED") {
    focus = { ...focus, state: "complete", title: "Shift selesai dan ditutup", description: `Ditutup oleh ${shift.ditutupOleh ?? "HSE"}. Buka laporan akhir atau buat shift berikutnya dari daftar shift.`, href: "/laporan", cta: "Buka laporan akhir" }
  } else if (shift.status === "DRAFT" && legacy.steps[3].selesai) {
    command = "TERBITKAN_SHIFT"
    focus = { ...focus, state: user.role === "HSE" ? "action" : "waiting", owner: "HSE", title: "Terbitkan shift agar instruksi dapat dibagikan", description: "Semua rencana peserta telah disetujui. HSE menerbitkan draft, lalu membagikan instruksi kepada mandor.", href: hub, cta: "Terbitkan shift" }
  } else if (shift.status === "ACTIVE" && legacy.steps[5].selesai) {
    command = "TUTUP_SHIFT"
    focus = { ...focus, state: user.role === "HSE" ? "action" : "waiting", owner: "HSE", title: "Semua tindakan terverifikasi. Tutup shift.", description: "HSE menutup shift untuk mengunci catatan dan menetapkan laporan akhir. Membuka laporan saja belum menutup shift.", href: hub, cta: "Tutup shift" }
  }
  return { ...legacy, focus, command, hub, shift }
}

export function managedStages(s: AppState, user: User) {
  const steps = workflow(s, user)
  const shift = currentShift(s)
  const active = shift?.status === "ACTIVE" || shift?.status === "CLOSED"
  const currentIds = new Set(s.rencana.filter(plan => plan.tanggal === s.tanggal && !plan.digantikan).map(plan => plan.id))
  const actions = s.tindakan.filter(action => currentIds.has(action.rencanaId))
  return [
    { title: "Siapkan peserta", owner: "HSE", href: `/shift/${shift?.id}#persiapan`, done: steps[0].selesai && steps[1].selesai },
    { title: "Isi bacaan panas", owner: "Petugas data · HSE", href: "/pengukuran", done: steps[2].selesai },
    { title: "Setujui & terbitkan", owner: "HSE", href: "/rencana", done: steps[3].selesai && active },
    { title: "Jalankan & laporkan", owner: "HSE → Mandor", href: steps[4].selesai ? "/tindakan" : "/instruksi", done: steps[4].selesai && actions.length > 0 && actions.every(action => action.status === "TINDAKAN_DILAPORKAN" || action.status === "TERVERIFIKASI") },
    { title: "Verifikasi & tutup", owner: "HSE", href: steps[5].selesai ? `/shift/${shift?.id}#penutupan` : "/tindakan", done: shift?.status === "CLOSED" },
  ]
}

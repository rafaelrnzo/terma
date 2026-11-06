import { currentShift } from "./management-state"
import { workflow } from "./workflow"
import { rencanaAktif, isiPesan } from "./store-plans"
import { scopedWorkspace } from "./workspace"
import { REGU } from "./config"
import type { AppState } from "./store-state"
import type { Role, User } from "./types"

export type ShiftTaskKey = "participants" | "sensors" | "plans" | "instructions" | "execution" | "finish"
export interface ShiftTask { key: ShiftTaskKey; title: string; description: string; done: boolean; owners: Role[]; progress: string; optional?: boolean }

export function shiftTaskFlow(workspace: AppState, user: User) {
  const state = scopedWorkspace(workspace, user)
  const shift = currentShift(workspace)
  const progress = workflow(state, user)
  const plans = rencanaAktif(state)
  const planIds = new Set(plans.map(plan => plan.id))
  const actions = state.tindakan.filter(action => planIds.has(action.rencanaId))
  const crews = REGU.filter(crew => state.pekerja.some(worker => worker.reguKode === crew.kode))
  const allShared = plans.length > 0 && progress[3].selesai && crews.every(crew => {
    const { rencanaIds } = isiPesan(state, crew.kode)
    return state.pengiriman.some(delivery => delivery.id === `${crew.kode}:${rencanaIds.join("+")}` && delivery.status === "DIBAGIKAN_MANUAL")
  })
  const submitted = actions.filter(action => action.status === "TINDAKAN_DILAPORKAN" || action.status === "TERVERIFIKASI").length
  const published = shift?.status === "ACTIVE" || shift?.status === "CLOSED"
  const steps: ShiftTask[] = [
    { key: "participants", title: "Data & adaptasi", description: "05.30 · Periksa peserta, penugasan dan riwayat adaptasi. Check-in pekerja berlangsung setelah instruksi pagi.", done: progress[0].selesai && progress[1].selesai, owners: ["HSE"], progress: progress[1].progress },
    { key: "sensors", title: "Cuaca & bacaan zona", description: "Prakiraan membantu draf pagi. Bacaan Station memperbarui rencana selama shift; bacaan satu hari penuh tidak diperlukan untuk memulai tinjauan.", done: progress[2].selesai, optional: true, owners: ["HSE", "PETUGAS_DATA"], progress: progress[2].progress },
    { key: "plans", title: "Tinjau rencana", description: "06.30 · Tinjau status, skor P dan batas tiap pekerja. Setujui versi rencana, lalu terbitkan.", done: progress[3].selesai && published, owners: ["HSE"], progress: progress[3].progress },
    { key: "instructions", title: "Instruksi", description: "06.45 · Bagikan hanya versi yang disetujui. Mandor menerima jadwal regu dan mengakui penerapannya.", done: published && progress[4].selesai, owners: allShared ? ["MANDOR"] : ["HSE"], progress: progress[4].progress },
    { key: "execution", title: "Pelaksanaan", description: "07.00–17.00 · Pekerja check-in, mandor memantau regu dan mencatat durasi aktual. Klinik menerima jawaban kondisi secara privat.", done: actions.length > 0 && submitted === actions.length && progress[3].selesai, owners: ["MANDOR"], progress: `${submitted}/${actions.length} tindakan sudah dilaporkan` },
    { key: "finish", title: "Verifikasi & tutup", description: "HSE memeriksa laporan, lalu menutup shift untuk menetapkan laporan akhir.", done: shift?.status === "CLOSED", owners: ["HSE"], progress: progress[5].progress },
  ]
  const firstPending = steps.findIndex(step => !step.done && !step.optional)
  return { steps, current: firstPending < 0 ? steps.length - 1 : firstPending, actions, plans, crews, allShared, verified: progress[5].selesai }
}

import { lingkupPekerja } from "./access"
import { REGU } from "./config"
import { isiPesan, rencanaAktif, type AppState } from "./store"
import { workflow } from "./workflow"
import type { Role, User } from "./types"

export interface ShiftFocus {
  href: string
  title: string
  description: string
  cta: string
  state: "action" | "waiting" | "complete"
  owner: Role
  stage: 1 | 2 | 3 | 4
}

const preparation = [
  { href: "/impor", title: "Lengkapi pekerja & penugasan", description: "Pastikan pekerja, regu, tugas, dan riwayat kehadiran tersedia untuk shift ini.", cta: "Siapkan data", owner: "PETUGAS_DATA", stage: 1 },
  { href: "/paparan", title: "Konfirmasi adaptasi pekerja", description: "Tinjau pekerja baru, pekerja kembali, dan riwayat yang belum lengkap sebelum menyetujui rencana.", cta: "Tinjau adaptasi", owner: "HSE", stage: 1 },
  { href: "/pengukuran", title: "Lengkapi bacaan panas zona", description: "Masih ada interval tanpa bacaan valid. Lengkapi pengukuran atau tinjau perubahan penugasan bersama HSE.", cta: "Periksa bacaan", owner: "PETUGAS_DATA", stage: 1 },
] satisfies Omit<ShiftFocus, "state">[]

export function shiftJourney(state: AppState, user: User) {
  const workers = lingkupPekerja(user, state.pekerja)
  const workerIds = new Set(workers.map(worker => worker.kode))
  const plans = rencanaAktif(state).filter(plan => workerIds.has(plan.pekerjaKode))
  const approved = plans.filter(plan => plan.disetujuiOleh)
  const planIds = new Set(approved.map(plan => plan.id))
  const actions = state.tindakan.filter(action => planIds.has(action.rencanaId))
  const crews = REGU.filter(crew => user.role !== "MANDOR" || crew.kode === user.reguKode)
  const deliveries = crews.map(crew => {
    const { rencanaIds } = isiPesan(state, crew.kode)
    const id = `${crew.kode}:${rencanaIds.join("+")}`
    return { crew, hasPlans: rencanaIds.length > 0, delivery: state.pengiriman.find(item => item.id === id && item.status !== "GAGAL") }
  }).filter(item => item.hasPlans)
  const steps = workflow(state, user)
  const needsReport = actions.filter(action => action.status === "DIAKUI" || action.status === "BELUM_SELESAI")
  const needsVerification = actions.filter(action => action.status === "TINDAKAN_DILAPORKAN")
  const verified = actions.filter(action => action.status === "TERVERIFIKASI").length
  const isClosed = steps[3].selesai && actions.length === approved.length && actions.length > 0 && verified === actions.length
  const focus = (): ShiftFocus => {
    if (user.role === "MANDOR") {
      if (deliveries.some(item => item.delivery && !item.delivery.diakui)) return { href: "/instruksi", title: "Akui instruksi untuk regu Anda", description: "Baca jadwal yang sudah disetujui HSE, lalu akui penerimaan. Pengakuan belum berarti pekerjaan terlaksana.", cta: "Baca & akui instruksi", state: "action", owner: "MANDOR", stage: 3 }
      if (needsReport.length) return { href: "/tindakan", title: "Catat pelaksanaan regu", description: `${needsReport.length} tindakan menunggu laporan. Isi durasi aktual dan catat bila instruksi tidak dapat dijalankan.`, cta: "Catat pelaksanaan", state: "action", owner: "MANDOR", stage: 3 }
      if (needsVerification.length) return { href: "/tindakan", title: "Laporan Anda menunggu verifikasi HSE", description: "Pelaksanaan sudah dilaporkan. HSE perlu memeriksa laporan sebelum durasinya menjadi paparan terverifikasi.", cta: "Lihat status laporan", state: "waiting", owner: "HSE", stage: 4 }
      if (isClosed) return { href: "/tindakan", title: "Laporan regu sudah diverifikasi", description: "Seluruh tindakan untuk versi rencana saat ini telah diperiksa HSE. Perubahan rencana dapat memerlukan instruksi baru.", cta: "Lihat hasil verifikasi", state: "complete", owner: "MANDOR", stage: 4 }
      return { href: "/instruksi", title: "Menunggu instruksi dari HSE", description: "HSE perlu menyetujui dan membagikan versi rencana untuk regu Anda. Anda tidak perlu mengisi atau menyetujui rencana HSE.", cta: "Lihat kesiapan instruksi", state: "waiting", owner: "HSE", stage: 3 }
    }
    if (user.role === "HSE" && needsVerification.length) return { href: "/tindakan", title: "Periksa laporan pelaksanaan", description: `${needsVerification.length} laporan mandor menunggu pemeriksaan. Verifikasi durasi atau kembalikan sebagai belum selesai.`, cta: "Verifikasi laporan", state: "action", owner: "HSE", stage: 4 }
    const pendingPreparation = preparation.find(item => !steps.find(step => step.href === item.href)?.selesai && (user.role === "HSE" || item.href !== "/paparan"))
    if (pendingPreparation) return { ...pendingPreparation, owner: user.role === "HSE" ? "HSE" : "PETUGAS_DATA", state: "action" }
    if (user.role === "PETUGAS_DATA") return { href: "/ringkasan", title: "Data siap ditinjau HSE", description: "Pekerja dan bacaan panas sudah tersedia. Selanjutnya HSE mengonfirmasi adaptasi dan menyetujui rencana; tugas Anda tidak mencakup persetujuan.", cta: "Lihat ringkasan shift", state: "waiting", owner: "HSE", stage: 2 }
    if (!steps[3].selesai) return { href: "/rencana", title: "Tinjau & setujui rencana", description: `${approved.length} dari ${workers.length} rencana disetujui. Buka alasan, jadwal, dan kualitas data setiap pekerja sebelum memberi persetujuan.`, cta: "Tinjau rencana", state: "action", owner: "HSE", stage: 2 }
    if (deliveries.some(item => !item.delivery)) return { href: "/instruksi", title: "Bagikan instruksi kepada mandor", description: "Rencana sudah disetujui. Salin atau pratinjau pesan per regu, lalu catat pembagiannya; penerimaan diakui terpisah oleh mandor.", cta: "Siapkan instruksi", state: "action", owner: "HSE", stage: 3 }
    if (deliveries.some(item => !item.delivery?.diakui)) return { href: "/instruksi", title: "Menunggu pengakuan mandor", description: "Pembagian instruksi sudah dicatat. Mandor regu terkait perlu mengakui versi ini sebelum melaporkan pelaksanaan.", cta: "Lihat penerimaan instruksi", state: "waiting", owner: "MANDOR", stage: 3 }
    if (!isClosed) return { href: "/tindakan", title: "Menunggu laporan mandor", description: "Instruksi sudah diakui. Mandor mencatat durasi dan tindakan aktual, kemudian HSE memverifikasi laporan tersebut.", cta: "Lihat pelaksanaan regu", state: "waiting", owner: "MANDOR", stage: 3 }
    return { href: "/laporan", title: "Shift sudah terverifikasi", description: "Seluruh tindakan untuk rencana aktif telah diverifikasi. Tinjau rekap, celah data, dan jejak aktivitas sebelum mencetak laporan.", cta: "Buka laporan shift", state: "complete", owner: "HSE", stage: 4 }
  }
  return { focus: focus(), steps, workers: workers.length, approved: approved.length, verified, reportPending: needsReport.length, verifyPending: needsVerification.length, isClosed }
}

export function guideRoutes(role: Role) {
  switch (role) {
    case "HSE": return ["/impor", "/paparan", "/pengukuran", "/rencana", "/instruksi", "/tindakan", "/laporan"]
    case "PETUGAS_DATA": return ["/impor", "/pengukuran", "/ringkasan"]
    case "MANDOR": return ["/instruksi", "/tindakan"]
  }
}

export function guideItinerary(state: AppState, user: User) {
  const routes = guideRoutes(user.role)
  if (user.role === "HSE") {
    const workers = new Set(lingkupPekerja(user, state.pekerja).map(worker => worker.kode))
    const plans = rencanaAktif(state).filter(plan => workers.has(plan.pekerjaKode))
    const plan = plans.find(item => !item.disetujuiOleh) ?? plans[0]
    if (plan) routes.splice(4, 0, `/pekerja/${encodeURIComponent(plan.pekerjaKode)}`)
  }
  return routes
}

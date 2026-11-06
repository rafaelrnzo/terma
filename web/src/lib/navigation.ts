import type { Role, User } from "./types"

export const NAV_GROUPS = [
  { label: "Beranda & shift", href: "/ringkasan", routes: [{ href: "/ringkasan", label: "Beranda & shift" }] },
  { label: "Data pekerja", href: "/impor", routes: [{ href: "/impor", label: "Data pekerja" }, { href: "/kesehatan-awal", label: "Baseline perusahaan" }] },
  { label: "Forecasting", href: "/forecasting", routes: [{ href: "/forecasting", label: "Peta prakiraan" }] },
  { label: "Monitoring", href: "/monitoring", routes: [{ href: "/monitoring", label: "Pantau shift" }, { href: "/perangkat", label: "Perangkat IoT" }, { href: "/absensi", label: "Absensi pekerja" }] },
  { label: "Laporan & evaluasi", href: "/laporan", routes: [{ href: "/laporan", label: "Laporan shift" }, { href: "/analitik", label: "Analitik shift" }, { href: "/insight", label: "Insight individu" }, { href: "/kesehatan", label: "Rekap paparan" }] },
]

export const ROLE_WORKSPACE: Record<Role, { title: string; purpose: string; nav: string; href: string }> = {
  HSE: { title: "Ruang kerja HSE", purpose: "Siapkan shift, setujui rencana, lalu verifikasi laporan mandor sampai shift selesai.", nav: "Beranda & shift", href: "/hse" },
  MANDOR: { title: "Tugas regu Anda", purpose: "Terima instruksi HSE, pantau regu, dan laporkan pekerjaan yang sudah dilaksanakan.", nav: "Tugas regu", href: "/mandor" },
  PETUGAS_DATA: { title: "Persiapan data", purpose: "Lengkapi data pekerja, bacaan WBGT, dan prakiraan agar HSE dapat menyiapkan rencana.", nav: "Persiapan data", href: "/admin" },
}

export function roleHomePath(user: User) { return ROLE_WORKSPACE[user.role].href }

export function navigationFor(user: User | null) {
  return NAV_GROUPS.filter(group => user?.role !== "MANDOR" || group.href !== "/impor")
}

export const SHIFT_ROUTES = ["/paparan", "/pengukuran", "/rencana", "/instruksi", "/tindakan"]
export function isShiftRoute(path: string) {
  return SHIFT_ROUTES.includes(path) || path.startsWith("/pekerja/") || path.startsWith("/regu/")
}
export function navigationGroup(path: string) {
  if (isShiftRoute(path) || path.startsWith("/shift/") || Object.values(ROLE_WORKSPACE).some(workspace => workspace.href === path)) return NAV_GROUPS[0]
  return NAV_GROUPS.find(group => group.routes.some(route => route.href === path))
}

import type { Role, User } from "./types"

export const NAV_GROUPS = [
  { label: "Beranda & shift", href: "/ringkasan", routes: [{ href: "/ringkasan", label: "Beranda & shift" }] },
  { label: "Data pekerja", href: "/impor", routes: [{ href: "/impor", label: "Data pekerja" }, { href: "/kesehatan-awal", label: "Baseline perusahaan" }] },
  { label: "Operasional shift", href: "/rencana", routes: [{ href: "/paparan", label: "Adaptasi pekerja" }, { href: "/rencana", label: "Rencana & persetujuan" }, { href: "/instruksi", label: "Instruksi regu" }, { href: "/tindakan", label: "Pelaksanaan & verifikasi" }] },
  { label: "Forecasting", href: "/forecasting", routes: [{ href: "/forecasting", label: "Peta prakiraan" }] },
  { label: "Monitoring", href: "/monitoring", routes: [{ href: "/monitoring", label: "Pantau shift" }, { href: "/pengukuran", label: "Bacaan WBGT" }, { href: "/perangkat", label: "Perangkat IoT" }, { href: "/absensi", label: "Absensi pekerja" }, { href: "/band", label: "Band bergilir" }] },
  { label: "Laporan & evaluasi", href: "/laporan", routes: [{ href: "/laporan", label: "Laporan shift" }, { href: "/analitik", label: "Analitik shift" }, { href: "/insight", label: "Insight individu" }, { href: "/kesehatan", label: "Rekap paparan" }] },
]

export const ROLE_WORKSPACE: Record<Role, { title: string; purpose: string; nav: string; href: string }> = {
  KLINIK: { title: "Ruang Klinik", purpose: "Tindak lanjuti check-in, kelola persetujuan dan ringkasan pemeriksaan pekerja.", nav: "Kotak masuk Klinik", href: "/klinik" },
  HSE: { title: "Ruang kerja HSE", purpose: "Siapkan shift, setujui rencana, lalu verifikasi laporan mandor sampai shift selesai.", nav: "Beranda & shift", href: "/hse" },
  MANDOR: { title: "Tugas regu Anda", purpose: "Terima instruksi HSE, pantau regu, dan laporkan pekerjaan yang sudah dilaksanakan.", nav: "Tugas regu", href: "/mandor" },
  PETUGAS_DATA: { title: "Persiapan data", purpose: "Lengkapi data pekerja, bacaan WBGT, dan prakiraan agar HSE dapat menyiapkan rencana.", nav: "Persiapan data", href: "/admin" },
}

export function roleHomePath(user: User) { return ROLE_WORKSPACE[user.role].href }

export function navigationFor(user: User | null) {
  if (user?.role === "KLINIK") return NAV_GROUPS.filter(group => ["/ringkasan", "/impor"].includes(group.href))
  return NAV_GROUPS.filter(group => (!user || group.routes.some(route=>pageAllowedFor(user,route.href))) && (user?.role !== "MANDOR" || group.href !== "/impor"))
}

export const SHIFT_ROUTES = ["/paparan", "/pengukuran", "/rencana", "/instruksi", "/tindakan"]
export function isShiftRoute(path: string) {
  return SHIFT_ROUTES.includes(path) || path.startsWith("/pekerja/") || path.startsWith("/regu/")
}
export function navigationGroup(path: string) {
  if (path.startsWith("/shift/") || Object.values(ROLE_WORKSPACE).some(workspace => workspace.href === path)) return NAV_GROUPS[0]
  if (path.startsWith("/pekerja/") || path.startsWith("/regu/")) return NAV_GROUPS.find(group=>group.href==="/rencana")
  return NAV_GROUPS.find(group => group.routes.some(route => route.href === path))
}

/** Browser prototype route projection; server authentication remains a separate integration. */
export function pageAllowedFor(user: User, path: string) {
  if (path === "/band") return user.role === "HSE" || user.role === "MANDOR"
  if (path.startsWith("/klinik")) return user.role === "KLINIK"
  const home = Object.entries(ROLE_WORKSPACE).find(([,value])=>value.href===path)
  if (home) return home[0] === user.role
  if (["/", "/kiosk", "/ringkasan"].includes(path)) return true
  if (user.role === "PETUGAS_DATA") return ["/impor","/absensi","/kesehatan-awal","/forecasting","/pengukuran","/perangkat","/monitoring"].includes(path) || path.startsWith("/shift/")
  if (user.role === "KLINIK") return ["/impor","/kesehatan-awal","/kesehatan","/monitoring"].includes(path)
  if (user.role === "MANDOR") return !["/impor","/kesehatan-awal","/paparan","/rencana","/pengukuran"].includes(path)
  return true
}

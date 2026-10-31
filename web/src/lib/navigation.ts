export const NAV_GROUPS = [
  { label: "Shift kerja", href: "/ringkasan", routes: [{ href: "/ringkasan", label: "Daftar shift" }] },
  { label: "Data pekerja", href: "/impor", routes: [{ href: "/impor", label: "Data pekerja" }] },
  { label: "Analitik", href: "/analitik", routes: [{ href: "/analitik", label: "Analitik shift" }, { href: "/insight", label: "Insight individu" }] },
  { label: "Perangkat IoT", href: "/perangkat", routes: [{ href: "/perangkat", label: "Perangkat IoT" }] },
  { label: "Laporan", href: "/laporan", routes: [{ href: "/laporan", label: "Laporan shift" }, { href: "/kesehatan", label: "Paparan & rujukan klinik" }] },
]

export const SHIFT_ROUTES = ["/paparan", "/pengukuran", "/rencana", "/instruksi", "/tindakan"]
export function isShiftRoute(path: string) {
  return SHIFT_ROUTES.includes(path) || path.startsWith("/pekerja/") || path.startsWith("/regu/")
}
export function navigationGroup(path: string) {
  if (isShiftRoute(path) || path.startsWith("/shift/")) return NAV_GROUPS[0]
  return NAV_GROUPS.find(group => group.routes.some(route => route.href === path))
}

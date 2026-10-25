export const NAV_GROUPS = [
  { label: "Dashboard", href: "/ringkasan", routes: [{ href: "/ringkasan", label: "Dashboard" }] },
  { label: "Data lapangan", href: "/impor", routes: [{ href: "/impor", label: "Pekerja & penugasan" }, { href: "/paparan", label: "Adaptasi pekerja" }, { href: "/pengukuran", label: "Pengukuran panas" }] },
  { label: "Rencana kerja", href: "/rencana", routes: [{ href: "/rencana", label: "Rencana kerja" }] },
  { label: "Tindak lanjut", href: "/tindakan", routes: [{ href: "/instruksi", label: "Instruksi mandor" }, { href: "/tindakan", label: "Pelaksanaan & verifikasi" }] },
  { label: "Laporan", href: "/laporan", routes: [{ href: "/laporan", label: "Laporan shift" }] },
]

export function navigationGroup(path: string) {
  if (path.startsWith("/pekerja/") || path.startsWith("/regu/")) return NAV_GROUPS[1]
  return NAV_GROUPS.find(group => group.routes.some(route => route.href === path))
}

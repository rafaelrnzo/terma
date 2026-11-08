"use client"

import { usePathname } from "next/navigation"

const titles: Record<string,string> = { "/impor":"Data pekerja", "/rencana":"Perencanaan shift", "/monitoring":"Monitoring shift", "/pengukuran":"Pengukuran WBGT / ISBB", "/forecasting":"Prakiraan cuaca", "/instruksi":"Instruksi regu", "/tindakan":"Pelaksanaan & verifikasi", "/absensi":"Absensi pekerja", "/laporan":"Pusat laporan", "/laporan/bulanan":"Pusat laporan", "/perangkat":"Perangkat IoT", "/hse":"Beranda shift", "/admin":"Persiapan data", "/mandor":"Tugas regu", "/klinik":"Klinik pekerja" }

export function RouteLoading() {
  const path = usePathname()
  const title = titles[path] ?? (path.startsWith("/shift/") ? "Ringkasan shift" : path.startsWith("/pemantauan/") ? "Pemantauan pekerja" : "Rencana pekerja")
  const worklist = ["/impor","/rencana","/instruksi","/tindakan","/absensi"].includes(path)
  return <div role="status" aria-label={`Memuat ${title}`} aria-busy="true" className="space-y-6">
    <div className="page-heading"><h1>{title}</h1></div>
    {worklist ? <section className="summon-panel overflow-hidden"><div className="grid gap-4 border-b p-5 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Cari pekerja</p><div className="skeleton-value mt-2 h-11" /></div><div><p className="text-xs text-muted-foreground">Regu</p><div className="skeleton-value mt-2 h-11" /></div><div><p className="text-xs text-muted-foreground">Status</p><div className="skeleton-value mt-2 h-11" /></div></div><div className="divide-y">{Array.from({length:5},(_,row)=><div key={row} className="grid grid-cols-3 gap-6 p-5"><div className="flex gap-3"><div className="skeleton-value size-8 shrink-0" /><div className="w-full"><div className="skeleton-value h-3 w-4/5" /><div className="skeleton-value mt-2 h-3 w-1/2" /></div></div><div className="skeleton-value h-4 w-3/4" /><div className="skeleton-value h-6 w-2/3" /></div>)}</div></section> : <><div className="role-metrics">{["Pekerja","Rencana","Tindakan","Verifikasi"].map(label=><div key={label}><span>{label}</span><div className="skeleton-value mt-4 h-8 w-16" /></div>)}</div><section className="summon-panel p-6"><h2 className="text-base font-semibold">{path.startsWith("/pemantauan/") ? "Sinyal pemantauan" : "Data shift"}</h2><div className="mt-6 grid gap-6 sm:grid-cols-2"><div className="skeleton-value h-64" /><div className="space-y-5">{Array.from({length:5},(_,row)=><div key={row} className="skeleton-value h-8" />)}</div></div></section></>}
  </div>
}

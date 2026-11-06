"use client"

import { DatabaseIcon, ArrowClockwiseIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"

export function CompanyConnection() {
  const { state, user, dispatch } = useApp()
  const company = managementOf(state)
  return <section className="summon-panel mb-6 flex flex-wrap items-center gap-4 p-5" aria-label="Data Hub perusahaan"><DatabaseIcon size={27} className="shrink-0 text-primary" /><div className="min-w-0 flex-1 basis-56"><h2 className="text-sm font-semibold">Data Hub perusahaan <span className="ml-2 text-xs font-normal text-primary">{company.companySync ? "Data tersedia" : "Menyiapkan data…"}</span></h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{company.workers.filter(worker => !worker.diarsipkan).length} pekerja aktif · {company.healthBaselines?.length ?? 0} ringkasan pemeriksaan · absensi dari kios</p><p className="mt-1 text-xs text-muted-foreground">{company.companySync ? `Diperbarui ${new Date(company.companySync.syncedAt).toLocaleString("id-ID")} · ${company.companySync.source === "LOCAL_ADAPTER" ? "Adaptor perusahaan lokal" : "Data ruang kerja"}` : "Menghubungkan master pekerja, penugasan, dan baseline perusahaan."}</p></div>{user?.role !== "MANDOR" && <Button size="sm" variant="outline" onClick={() => dispatch({ type: "SINKRON_PERUSAHAAN" })}><ArrowClockwiseIcon />Sinkronkan data</Button>}</section>
}

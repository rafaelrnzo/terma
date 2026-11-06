"use client"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/app-shell"
import { ModuleTabs } from "@/components/module-tabs"
import { ShiftMonitoring } from "@/components/shift-monitoring"
import dynamic from "next/dynamic"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { pageAllowedFor } from "@/lib/navigation"
import { tanggalLabel } from "@/lib/workspace"

const ShiftAnalytics = dynamic(() => import("@/components/shift-analytics").then(module => module.ShiftAnalytics), { loading: () => <div className="grid gap-6 xl:grid-cols-2" role="status" aria-label="Memuat analitik"><div className="summon-panel p-6"><h2>Profil panas zona</h2><div className="skeleton-value mt-6 h-64" /></div><div className="summon-panel p-6"><h2>Adaptasi pekerja</h2><div className="skeleton-value mt-6 h-64" /></div></div> })

export function MonitoringWorkspace() {
  const tab = useSearchParams().get("tab")
  const { state, user } = useApp()
  if (!user) return null
  const shift = currentShift(state)
  const canAnalyze = pageAllowedFor(user, "/analitik")
  const analytics = tab === "analitik" && canAnalyze
  return <><PageHeader title={user.role === "MANDOR" ? "Monitoring regu" : "Monitoring shift"} summary={shift ? `${shift.nama} · ${tanggalLabel(shift.tanggal)}` : undefined} />{canAnalyze && <ModuleTabs label="Monitoring shift" active={analytics ? "analitik" : "pemantauan"} tabs={[{key:"pemantauan",label:"Pemantauan",href:"/monitoring"},{key:"analitik",label:"Analitik",href:"/monitoring?tab=analitik"}]} />}<div className="module-panel" key={analytics ? "analitik" : "pemantauan"}>{analytics ? <ShiftAnalytics /> : <ShiftMonitoring />}</div></>
}

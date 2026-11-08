"use client"
import { PageHeader } from "@/components/app-shell"
import { ModuleTabs } from "@/components/module-tabs"
import { ShiftReport } from "@/components/shift-report"
import { MonthlyExposureReport } from "@/components/monthly-exposure-report"
import { useApp } from "@/lib/store"
import { pageAllowedFor } from "@/lib/navigation"

import { DoseReport } from "@/components/dose-report"
export function ReportWorkspace({ monthly = false }: { monthly?: boolean }) {
  const { user } = useApp()
  if (!user) return null
  const tabs = [{key:"shift",label:"Laporan shift",href:"/laporan"},{key:"bulanan",label:"Rekap bulanan",href:"/laporan/bulanan"}].filter(tab => pageAllowedFor(user, tab.href))
  return <><PageHeader title="Pusat laporan" /><ModuleTabs label="Laporan" active={monthly ? "bulanan" : "shift"} tabs={tabs} />{monthly ? <MonthlyExposureReport /> : <><ShiftReport /><DoseReport /></>}</>
}

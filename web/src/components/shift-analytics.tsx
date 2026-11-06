"use client"

import { DashboardSnapshot } from "@/components/dashboard-snapshot"
import { HeatTrend } from "@/components/heat-trend"
import { AcclimatisationChart } from "@/components/acclimatisation-chart"
import { ShiftWorkers } from "@/components/shift-workers"
import { useApp } from "@/lib/store"

export function ShiftAnalytics() {
  const { user } = useApp()
  if (!user) return null
  return <>

    <DashboardSnapshot />
    <div className="grid gap-6 xl:grid-cols-2"><HeatTrend /><AcclimatisationChart /></div>
    <ShiftWorkers />

  </>
}

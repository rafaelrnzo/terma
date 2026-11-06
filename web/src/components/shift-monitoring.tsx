"use client"

import { HeatMonitor } from "@/components/heat-monitor"
import { currentShift } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { useApp } from "@/lib/store"

export function ShiftMonitoring() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  if (!user || !shift) return null
  const flow = shiftTaskFlow(state, user)
  const reported = flow.actions.filter(action => action.status === "TINDAKAN_DILAPORKAN" || action.status === "TERVERIFIKASI").length
  const verified = flow.actions.filter(action => action.status === "TERVERIFIKASI").length

  return <>

    <div className="role-metrics"><div><span>Rencana dalam lingkup Anda</span><strong>{flow.plans.length}</strong></div><div><span>Tindakan tercatat</span><strong>{flow.actions.length}</strong></div><div><span>Sudah dilaporkan</span><strong>{reported}<small> / {flow.actions.length}</small></strong></div><div><span>Diverifikasi HSE</span><strong>{verified}<small> / {flow.actions.length}</small></strong></div></div>
    <HeatMonitor />

  </>
}

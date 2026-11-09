"use client"

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"

export function ResetAttendanceButtons({ workerCode, hasDeparture, compact = false }: { workerCode: string; hasDeparture: boolean; compact?: boolean }) {
  const { dispatch } = useApp()
  return <div className={compact ? "attendance-reset-actions attendance-reset-actions-compact" : "attendance-reset-actions"}>
    {hasDeparture && <Button size="sm" variant="outline" onClick={() => dispatch({ type: "RESET_ABSEN_PULANG", pekerjaKode: workerCode })}><ArrowCounterClockwiseIcon />Reset absen pulang</Button>}
    <Button size="sm" variant="outline" onClick={() => dispatch({ type: "RESET_ABSEN_MASUK", pekerjaKode: workerCode })}><ArrowCounterClockwiseIcon />Reset absen datang</Button>
  </div>
}

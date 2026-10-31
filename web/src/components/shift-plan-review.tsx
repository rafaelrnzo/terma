"use client"

import { Button } from "@/components/ui/button"
import { RencanaCard } from "@/components/rencana-card"
import { ConfirmAction } from "@/components/confirm-action"
import { rencanaAktif, useApp, useIzin } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { scopedWorkspace } from "@/lib/workspace"

export function ShiftPlanReview() {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  const shift = currentShift(workspace)
  const plans = rencanaAktif(state)
  const pending = plans.filter(plan => !plan.disetujuiOleh)
  const approved = plans.length - pending.length
  if (!state.rencanaDihitung) return <div className="wizard-empty"><h3>Data peserta dan sensor siap.</h3><p>Hitung rencana, lalu tinjau batas dan jadwal setiap pekerja.</p><Button disabled={!izin("HITUNG_RENCANA")} onClick={() => dispatch({ type: "HITUNG_RENCANA" })}>Hitung rencana peserta</Button></div>
  return <div data-guide="plans" className="space-y-5"><p className="wizard-progress" role="status">{approved} dari {state.pekerja.length} rencana sudah disetujui</p>{pending[0] ? <><p className="text-sm text-muted-foreground">Tinjau rencana berikut. Setelah disetujui, pekerja berikutnya akan ditampilkan.</p><RencanaCard key={pending[0].id} r={pending[0]} mode={user.role === "HSE" ? "hse" : "mandor"} /></> : <><div className="wizard-result"><h3>Seluruh rencana sudah disetujui.</h3><p>{shift?.status === "DRAFT" ? "Terbitkan shift untuk menyiapkan instruksi mandor." : "Rencana sudah diterbitkan untuk pelaksanaan shift."}</p></div>{shift?.status === "DRAFT" && <ConfirmAction label="Terbitkan shift" guide="publish-shift" disabled={!izin("KELOLA_SHIFT")} title="Terbitkan shift?" description="Rencana telah ditinjau dan disetujui. Selanjutnya bagikan instruksi kepada mandor." onConfirm={() => dispatch({ type: "TERBITKAN_SHIFT", shiftId: shift.id })} />}</>}
    {approved > 0 && <details><summary className="cursor-pointer text-sm text-muted-foreground">Rencana yang sudah disetujui ({approved})</summary><div className="mt-4 space-y-4">{plans.filter(plan => plan.disetujuiOleh).map(plan => <RencanaCard key={plan.id} r={plan} mode={user.role === "HSE" ? "hse" : "mandor"} />)}</div></details>}
  </div>
}

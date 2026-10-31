"use client"

import { LaporDialog, VerifikasiDialog } from "@/components/action-dialogs"
import { LifecycleBadge } from "@/components/status"
import { useApp, useIzin } from "@/lib/store"
import { shiftTaskFlow } from "@/lib/shift-task-flow"

export function ShiftExecution({ verify = false }: { verify?: boolean }) {
  const { state, user } = useApp()
  const izin = useIzin()
  if (!user) return null
  const { actions } = shiftTaskFlow(state, user)
  return <div data-guide="execution" className="space-y-4">{actions.map(action => {
    const worker = state.pekerja.find(person => person.kode === action.pekerjaKode)
    const canReport = ["DIAKUI", "TINDAKAN_DILAPORKAN", "BELUM_SELESAI"].includes(action.status)
    return <article key={action.id} className="wizard-worker"><div className="wizard-worker-heading"><div><h3>{worker?.nama ?? action.pekerjaKode}</h3><p>{action.deskripsi}</p></div><LifecycleBadge status={action.status} /></div><dl className="wizard-action-minutes"><div><dt>Rencana</dt><dd>{action.menitDirencanakan} menit</dd></div><div><dt>Laporan mandor</dt><dd>{action.menitDilaporkan === undefined ? "Belum dilaporkan" : `${action.menitDilaporkan} menit`}</dd></div><div><dt>Verifikasi HSE</dt><dd>{action.menitDiverifikasi === undefined ? "Belum diverifikasi" : `${action.menitDiverifikasi} menit`}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2">{!verify && canReport && izin("LAPOR_TINDAKAN", action.reguKode) && <LaporDialog t={action} />}{action.status === "TINDAKAN_DILAPORKAN" && izin("VERIFIKASI") && <VerifikasiDialog t={action} />}</div>{action.status === "BELUM_SELESAI" && <p className="mt-3 text-sm text-muted-foreground">Laporan dikembalikan HSE. Mandor memperbaiki laporan yang sama.</p>}</article>
  })}</div>
}

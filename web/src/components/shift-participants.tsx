"use client"

import { useState } from "react"
import { WorkerAdaptation } from "@/components/worker-adaptation"
import { UbahPenugasan } from "@/components/rencana-card"
import { Button } from "@/components/ui/button"
import { useApp, useIzin, kandidatUntuk } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"
import { REGU, TUGAS, ZONA } from "@/lib/config"

export function ShiftParticipants() {
  const { state: workspace, user } = useApp()
  const izin = useIzin()
  const [reviewCode, setReviewCode] = useState<string | null>(null)
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  const candidates = state.pekerja.filter(worker => kandidatUntuk(state, worker).pemicu)
  const pending = candidates.filter(worker => !state.konfirmasi.some(row => row.pekerjaKode === worker.kode))
  const current = candidates.find(worker => worker.kode === reviewCode) ?? pending[0]
  const assignment = state.penugasan.find(row => row.pekerjaKode === current?.kode)
  return <div data-guide="adaptation" className="space-y-5"><p className="wizard-progress" role="status">{state.pekerja.length} peserta · {candidates.length - pending.length}/{candidates.length} konfirmasi adaptasi selesai</p>
    {current ? <><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Konfirmasi pekerja ini untuk melanjutkan ke peserta berikutnya.</p>{assignment && izin("UBAH_PENUGASAN") && <UbahPenugasan pekerjaKode={current.kode} zonaAwal={assignment.zonaKode} tugasAwal={assignment.tugasKode} />}</div><WorkerAdaptation key={current.kode} p={current} compact onSaved={() => setReviewCode(null)} /></> : <div className="wizard-result"><div><h3>Peserta sudah siap.</h3><p>Seluruh konfirmasi yang diperlukan tersimpan. Berikutnya periksa sensor.</p></div></div>}
    <details><summary className="cursor-pointer text-sm text-muted-foreground">Daftar peserta dan penugasan ({state.pekerja.length})</summary><div className="mt-4 divide-y">{state.pekerja.map(worker => {
      const row = state.penugasan.find(item => item.pekerjaKode === worker.kode)
      return <div key={worker.kode} className="wizard-worker-heading py-3"><div><h3>{worker.nama}</h3><p>{worker.kode} · {REGU.find(item => item.kode === worker.reguKode)?.nama}</p><p>{TUGAS.find(item => item.kode === row?.tugasKode)?.nama} · {ZONA.find(item => item.kode === row?.zonaKode)?.nama}</p></div>{kandidatUntuk(state,worker).pemicu && <Button variant="outline" disabled={!izin("KONFIRMASI_PAPARAN")} onClick={() => setReviewCode(worker.kode)}>Tinjau {worker.nama}</Button>}</div>
    })}</div></details>
  </div>
}

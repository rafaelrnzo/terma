"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { OptionSelect } from "@/components/ui/option-select"
import { WorkerBandStatus } from "@/components/worker-health-detail"
import { lingkupPekerja } from "@/lib/access"
import { currentBandAllocations } from "@/lib/band-management"
import { hasConsent } from "@/lib/clinic"
import { BAND_UNITS } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"

/** TERMA Band cell in the worker directory: Klinik records consent, HSE assigns a free Band, otherwise the latest reading. */
export function WorkerBandCell({ code, date }: { code: string; date: string }) {
  const { state, user, dispatch } = useApp()
  const [picked, pick] = useState("")
  const shift = currentShift(state)
  const active = currentBandAllocations(state)
  const allocation = active.find(row => row.pekerjaKode === code)
  if (user?.role === "KLINIK" && !hasConsent(state, code, "BAND")) return <div>
    <Button size="sm" variant="outline" onClick={() => dispatch({ type: "PERSETUJUAN_MEDIS", pekerjaKode: code, jenis: "BAND", aktif: true })}>Catat persetujuan Band</Button>
    <p className="mt-1 text-xs text-muted-foreground">Setelah persetujuan tertulis pekerja</p>
  </div>
  const assignable = user?.role === "HSE" && shift && shift.tanggal === date && shift.status !== "CLOSED" && shift.workspace.pekerja.some(worker => worker.kode === code) && !allocation?.dipakaiPada
  if (!assignable) return <WorkerBandStatus code={code} date={date} />
  if (!hasConsent(state, code, "BAND")) return <p className="text-sm text-muted-foreground">Perlu persetujuan Band dari Klinik</p>
  if (allocation) return <div><p className="text-sm">{allocation.bandId} ditetapkan</p><p className="mt-1 text-xs text-muted-foreground">Menunggu serah-terima mandor</p></div>
  const free = BAND_UNITS.filter(bandId => !active.some(row => row.bandId === bandId))
  if (!free.length) return <p className="text-sm text-muted-foreground">Semua Band sedang ditugaskan</p>
  const bandId = picked || free[0]
  return <div className="flex items-center gap-2">
    <OptionSelect id={`band-${code}`} aria-label="Pilih unit Band" value={bandId} onValueChange={pick} options={free.map(id => ({ value: id, label: id }))} />
    <Button size="sm" variant="outline" onClick={() => dispatch({ type: "ATUR_BAND", bandId, pekerjaKode: code })}>Tetapkan</Button>
  </div>
}

/** Foreman's Band handoff for their own crew, on the foreman home. */
export function BandHandoff() {
  const { state, user, dispatch } = useApp()
  const shift = currentShift(state)
  if (!user || user.role !== "MANDOR" || !shift) return null
  const workers = lingkupPekerja(user, shift.workspace.pekerja)
  const mine = currentBandAllocations(state).filter(row => workers.some(worker => worker.kode === row.pekerjaKode))
  return <section className="summon-panel mt-6 p-5" aria-labelledby="band-handoff-title">
    <h2 id="band-handoff-title" className="font-semibold">Serah-terima TERMA Band</h2>
    {!mine.length ? <p className="mt-2 text-sm text-muted-foreground">Belum ada Band yang ditetapkan HSE untuk regu Anda.</p>
      : <ul className="mt-3 divide-y">{mine.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <span><strong>{row.bandId}</strong> · {workers.find(worker => worker.kode === row.pekerjaKode)?.nama} · {row.dipakaiPada ? "sedang dipakai" : "menunggu serah-terima"}</span>
        {row.dipakaiPada
          ? <Button size="sm" variant="outline" disabled={shift.status !== "ACTIVE"} onClick={() => dispatch({ type: "KEMBALI_BAND", allocationId: row.id })}>Dikembalikan & dibersihkan</Button>
          : <Button size="sm" disabled={shift.status !== "ACTIVE"} onClick={() => dispatch({ type: "SERAH_BAND", allocationId: row.id })}>Sudah dipakai</Button>}
      </li>)}</ul>}
    {shift.status !== "ACTIVE" && mine.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Serah-terima tersedia setelah HSE menerbitkan shift.</p>}
  </section>
}

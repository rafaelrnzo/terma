"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect } from "react"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { DeviceReadingsButton } from "@/components/device-readings-button"

export function ShiftSensorTask({ deviceFigure, done, progress }: { deviceFigure: ReactNode; done: boolean; progress: string }) {
  const { state, user, dispatch } = useApp()
  const shift = currentShift(state)
  const canSync = (user?.role === "HSE" || user?.role === "PETUGAS_DATA") && shift?.status === "DRAFT"
  useEffect(() => { if (canSync && !done) dispatch({ type: "AMBIL_BACAAN_PERANGKAT" }) }, [canSync, done, shift?.id, dispatch])
  return <div data-guide="sensor-task" className="space-y-5">{done ? <div className="wizard-result"><CheckCircleIcon size={20} /><div><h3>Bacaan shift sudah lengkap.</h3><p>{progress}. Lanjutkan untuk menghitung rencana peserta.</p></div></div> : <div className="wizard-sensor-action"><div><h3>Gunakan WBGT dari Station untuk shift ini.</h3><p>Angka bergerak di bawah adalah pembacaan perangkat. Bacaan disinkronkan otomatis ke perhitungan rencana pada shift ini.</p><p className="wizard-progress">{progress}</p></div><DeviceReadingsButton label="Sinkronkan bacaan perangkat" /></div>}
    <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">Catat bacaan alat tambahan</summary><p className="mt-3">Gunakan cara ini untuk sumber pengukuran lain. <Link className="underline" href="/pengukuran">Buka pengukuran manual</Link>; setelah selesai, kembali ke alur shift.</p></details>
    <details open={!done}><summary className="cursor-pointer text-sm text-muted-foreground">{done ? "Lihat pemantauan Station" : "Pemantauan Station"}</summary><div className="mt-4">{deviceFigure}</div></details>
  </div>
}

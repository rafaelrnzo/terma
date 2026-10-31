"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { DeviceReadingsButton } from "@/components/device-readings-button"

export function ShiftSensorTask({ deviceFigure, done, progress }: { deviceFigure: ReactNode; done: boolean; progress: string }) {
  return <div data-guide="sensor-task" className="space-y-5">{done ? <div className="wizard-result"><CheckCircleIcon size={20} /><div><h3>Bacaan shift sudah lengkap.</h3><p>{progress}. Lanjutkan untuk menghitung rencana peserta.</p></div></div> : <div className="wizard-sensor-action"><div><h3>Gunakan WBGT dari Station untuk shift ini.</h3><p>Angka bergerak di bawah adalah pembacaan perangkat. Tekan Simpan untuk memasukkannya ke perhitungan rencana.</p><p className="wizard-progress">{progress}</p></div><DeviceReadingsButton label="Simpan bacaan untuk shift" /></div>}
    <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">Input manual atau impor CSV</summary><p className="mt-3">Gunakan cara ini untuk sumber pengukuran lain. <Link className="underline" href="/pengukuran">Buka pengukuran manual</Link>; setelah selesai, kembali ke alur shift.</p></details>
    <details open={!done}><summary className="cursor-pointer text-sm text-muted-foreground">{done ? "Lihat pemantauan Station" : "Pemantauan Station"}</summary><div className="mt-4">{deviceFigure}</div></details>
  </div>
}

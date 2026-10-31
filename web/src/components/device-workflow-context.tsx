"use client"

import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { shiftTaskFlow } from "@/lib/shift-task-flow"

export function DeviceWorkflowContext() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  const flow = user && shift ? shiftTaskFlow(state, user) : null
  const closed = shift?.status === "CLOSED"
  return <section className="wizard-device-context summon-panel mb-6" data-guide="device-context"><div><p className="eyebrow">PEMANTAUAN PERANGKAT</p><h2>{shift && !closed ? `Data untuk ${shift.nama}` : "Perangkat mendukung alur shift."}</h2><p>{shift && !closed ? `Tugas berikutnya: ${flow?.steps[flow.current].title}. Bacaan disimpan dari langkah Sensor di dalam shift; halaman ini untuk memantau alat.` : "Buat atau buka shift, siapkan peserta, lalu gunakan bacaan Station di langkah Sensor. Tap RFID dan Band dapat dipantau sebagai informasi perangkat."}</p></div><Button asChild><Link href={shift && !closed ? `/shift/${shift.id}` : "/ringkasan"}>{shift && !closed ? "Lanjutkan alur shift" : "Mulai dari shift kerja"}<ArrowRightIcon /></Link></Button></section>
}

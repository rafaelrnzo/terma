"use client"
import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"

export function DeviceWorkflowContext() {
  const {state,user}=useApp()
  const shift=currentShift(state)
  const measurements=user?.role==="HSE" || user?.role==="PETUGAS_DATA"
  return <section className="monitor-context summon-panel mb-6" data-guide="device-context"><div><p className="eyebrow">PEMANTAUAN PERANGKAT</p><h2>{shift ? `Perangkat · ${shift.nama}` : "Perangkat lokasi"}</h2><p>Station, Water Station dan Band mendukung pemantauan. Bacaan perencanaan dikelola pada modul Bacaan WBGT.</p></div><Button asChild variant="outline"><Link href={measurements ? "/pengukuran" : "/monitoring"}>{measurements ? "Kelola bacaan WBGT" : "Monitoring regu"}<ArrowRightIcon /></Link></Button></section>
}

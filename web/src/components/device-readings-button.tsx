"use client"

import Link from "next/link"
import { BroadcastIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useApp, useIzin } from "@/lib/store"
import { currentShift } from "@/lib/management-state"

export function DeviceReadingsButton({ label = "Ambil bacaan perangkat" }: { label?: string }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const shift = currentShift(state)
  if (!shift) return <Button asChild variant="outline"><Link href="/ringkasan">Buka shift untuk menggunakan bacaan</Link></Button>
  if (shift.status === "CLOSED") return <p className="text-xs text-muted-foreground">Catatan shift ini sudah dikunci.</p>
  return <Button data-guide="device-readings" disabled={!izin("INPUT_PENGUKURAN")} onClick={() => dispatch({ type: "AMBIL_BACAAN_PERANGKAT" })}><BroadcastIcon />{label}</Button>
}

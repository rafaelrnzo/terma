"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ShiftWorkspace } from "@/components/shift-workspace"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"

export default function ShiftPage() {
  const { id } = useParams<{ id: string }>()
  const { state, user, ready, dispatch } = useApp()
  const target = state.management?.shifts.find(shift => shift.id === id)
  const accessible = target && (user?.role !== "MANDOR" || target.workspace.pekerja.some(worker => worker.reguKode === user.reguKode))
  useEffect(() => { if (ready && accessible) dispatch({ type: "BUKA_SHIFT", shiftId: id }) }, [ready, accessible, id, dispatch])
  if (!ready) return <p>Memuat shift…</p>
  if (!accessible) return <div className="summon-panel p-6"><h1 className="text-xl font-semibold">Shift tidak tersedia</h1><p className="my-4 text-sm text-muted-foreground">Shift mungkin sudah dihapus atau tidak memuat regu Anda.</p><Button asChild variant="outline"><Link href="/ringkasan">Kembali ke daftar shift</Link></Button></div>
  if (currentShift(state)?.id !== id) return <p>Membuka shift…</p>
  return <ShiftWorkspace />
}

"use client"
import Link from "next/link"
import { ConfirmAction } from "@/components/confirm-action"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { workflow } from "@/lib/workflow"

export function ShiftClosure() {
  const {state,user,dispatch}=useApp()
  const shift=currentShift(state)
  if(user?.role!=="HSE" || shift?.status!=="ACTIVE")return null
  const verified=workflow(state,user)[5].selesai
  const bands=shift.bands?.filter(row=>row.dipakaiPada && !row.dikembalikanPada && !row.dibatalkanPada).length ?? 0
  return <section className="summon-panel mt-6 flex flex-wrap items-center justify-between gap-4 p-5" data-guide="close-shift"><div><h2 className="font-semibold">Penutupan shift</h2><p className="mt-2 text-sm text-muted-foreground">{verified ? "Seluruh tindakan pada rencana aktif telah diverifikasi." : "Verifikasi seluruh tindakan dan versi rencana aktif sebelum menutup shift."}</p>{bands>0 && <p className="mt-2 text-sm">{bands} Band masih dipakai. <Link href="/mandor" className="text-primary underline">Mandor mencatat pengembalian Band</Link>.</p>}</div><ConfirmAction label="Tutup shift" title="Tutup shift dan kunci laporan?" description="Rencana, pelaksanaan dan laporan akan menjadi hanya-baca." disabled={!verified || bands>0} onConfirm={()=>dispatch({type:"TUTUP_SHIFT",shiftId:shift.id})} /></section>
}

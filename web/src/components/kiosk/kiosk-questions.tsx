"use client"

import { useState } from "react"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { HeartbeatIcon } from "@phosphor-icons/react/dist/csr/Heartbeat"
import { Button } from "@/components/ui/button"
import type { BodyCondition, BodyComplaint } from "@/lib/worker-readiness"

const reasons: BodyComplaint[] = ["Demam", "Diare/muntah", "Kurang tidur", "Lain"]

export function KioskQuestions({ onSave, onBack }: { onSave: (condition: BodyCondition, complaints: BodyComplaint[]) => void; onBack: () => void }) {
  const [unwell,setUnwell] = useState(false)
  return <div className="space-y-5">
    <p className="kiosk-device-note">Jawaban hanya tersedia untuk Klinik. Mandor melihat status dan arahan kerja.</p>
    {unwell ? <><h2 className="text-lg font-semibold">Apa yang Anda rasakan?</h2><div className="grid grid-cols-2 gap-3">{reasons.map(reason=><Button key={reason} variant="outline" className="h-24 whitespace-normal text-base" onClick={()=>onSave("ADA_KELUHAN",[reason])}>{reason}</Button>)}</div><Button variant="ghost" onClick={()=>setUnwell(false)}><ArrowLeftIcon />Kembali ke kondisi</Button></> : <div className="grid grid-cols-2 gap-4"><Button className="h-36 flex-col gap-3 whitespace-normal text-base" onClick={()=>onSave("BAIK",[])}><CheckCircleIcon className="size-8" aria-hidden />Ya, merasa baik</Button><Button variant="outline" className="h-36 flex-col gap-3 whitespace-normal text-base" onClick={()=>setUnwell(true)}><HeartbeatIcon className="size-8" aria-hidden />Kurang sehat</Button></div>}
    <Button type="button" variant="ghost" onClick={onBack}><ArrowLeftIcon />Ganti pekerja</Button>
  </div>
}

"use client"

import { OptionSelect } from "@/components/ui/option-select"
import { useState } from "react"
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera"
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/csr/IdentificationCard"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { Label } from "@/components/ui/label"
import { CameraEntry } from "./camera-entry"
import { CardEntry } from "./card-entry"
import type { Pekerja } from "@/lib/types"
import type { CheckinMethod } from "@/lib/kiosk-entry"

type EntryMode = "camera" | "card"
const modes = [{ value: "camera", title: "Via kamera", description: "Buka kamera & konfirmasi wajah", Icon: CameraIcon }, { value: "card", title: "Tap kartu", description: "Tempelkan kartu ke reader", Icon: IdentificationCardIcon }] satisfies { value: EntryMode; title: string; description: string; Icon: typeof CameraIcon }[]

export function KioskIdentity({ workers, onIdentified }: { workers: Pekerja[]; onIdentified: (code: string, method: CheckinMethod) => void }) {
  const [mode, setMode] = useState<EntryMode>("camera")
  const [code, setCode] = useState("")
  const worker = workers.find(person => person.kode === code)
  return <div className="kiosk-identity">
    <div className="kiosk-entry-modes" role="group" aria-label="Cara absen"><span className="kiosk-method-indicator" data-mode={mode} aria-hidden />{modes.map(item => <button key={item.value} type="button" aria-pressed={mode === item.value} onClick={() => setMode(item.value)}><span className="selectable-icon"><item.Icon className="icon-outline" /><item.Icon className="icon-fill" weight="fill" /></span><strong>{item.title}</strong><small>{item.description}</small></button>)}</div>
    <div className="kiosk-worker-select"><Label htmlFor="kiosk-worker">{mode === "card" ? "Pilih kartu pekerja" : "Siapa yang akan absen?"}</Label><OptionSelect id="kiosk-worker" value={code} onValueChange={setCode} options={workers.map(person=>({value:person.kode,label:`${person.nama} · ${person.kode}`}))} placeholder="Pilih nama / ID pekerja" searchPlaceholder="Cari nama atau ID pekerja…" /></div>
    {mode === "camera" ? <CameraEntry name={worker?.nama} onConfirm={method => { if (worker) onIdentified(worker.kode, method) }} /> : worker ? <CardEntry key={worker.kode} name={worker.nama} code={worker.kode} onConfirm={() => onIdentified(worker.kode, "TAP_KARTU")} /> : <div className="kiosk-identify-empty"><IdentificationCardIcon size={32} /><p>Pilih {mode === "card" ? "kartu" : "nama"} pekerja untuk memulai.</p><span>Identitas<ArrowRightIcon size={14} />Kondisi tubuh<ArrowRightIcon size={14} />Absen tercatat</span></div>}
  </div>
}

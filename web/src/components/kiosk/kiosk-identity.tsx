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

export function KioskIdentity({ workers, checkedIn, onIdentified }: { workers: Pekerja[]; checkedIn: Set<string>; onIdentified: (code: string, method: CheckinMethod) => void }) {
  const [mode, setMode] = useState<EntryMode>("camera")
  const [code, setCode] = useState("")
  const worker = workers.find(person => person.kode === code && !checkedIn.has(person.kode))
  // Workers who already checked in this shift stay listed (so nobody thinks they are missing) but cannot be picked again.
  const options = workers.toSorted((a, b) => Number(checkedIn.has(a.kode)) - Number(checkedIn.has(b.kode))).map(person => ({ value: person.kode, label: `${person.nama} · ${person.kode}${checkedIn.has(person.kode) ? " · sudah absen" : ""}`, keywords: person.kode, disabled: checkedIn.has(person.kode) }))
  const remaining = workers.filter(person => !checkedIn.has(person.kode)).length
  return <div className="kiosk-identity">
    <div className="kiosk-entry-modes" role="group" aria-label="Cara absen"><span className="kiosk-method-indicator" data-mode={mode} aria-hidden />{modes.map(item => <button key={item.value} type="button" aria-pressed={mode === item.value} onClick={() => setMode(item.value)}><span className="selectable-icon"><item.Icon className="icon-outline" /><item.Icon className="icon-fill" weight="fill" /></span><strong>{item.title}</strong><small>{item.description}</small></button>)}</div>
    <div className="kiosk-worker-select"><Label htmlFor="kiosk-worker">{mode === "card" ? "Pilih kartu pekerja" : "Siapa yang akan absen?"} <span className="font-normal text-muted-foreground">· {remaining} dari {workers.length} belum absen</span></Label><OptionSelect id="kiosk-worker" value={worker ? code : ""} onValueChange={setCode} options={options} placeholder={remaining ? "Pilih nama / ID pekerja" : "Semua pekerja sudah absen"} searchPlaceholder="Cari nama atau ID pekerja…" /></div>
    {mode === "camera" ? <CameraEntry name={worker?.nama} onConfirm={method => { if (worker) onIdentified(worker.kode, method) }} /> : worker ? <CardEntry key={worker.kode} name={worker.nama} code={worker.kode} onConfirm={() => onIdentified(worker.kode, "TAP_KARTU")} /> : <div className="kiosk-identify-empty"><IdentificationCardIcon size={32} /><p>Pilih {mode === "card" ? "kartu" : "nama"} pekerja untuk memulai.</p><span>Identitas<ArrowRightIcon size={14} />Kondisi tubuh<ArrowRightIcon size={14} />Absen tercatat</span></div>}
  </div>
}

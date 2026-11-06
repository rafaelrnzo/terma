"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeftIcon, HeartbeatIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { BODY_COMPLAINTS, type BodyCondition, type BodyComplaint } from "@/lib/worker-readiness"

const conditions = [
  { value: "BAIK", label: "Merasa baik", detail: "Tidak ada keluhan saat ini" },
  { value: "KURANG_BUGAR", label: "Kurang bugar", detail: "Merasa lelah atau kurang fit" },
  { value: "ADA_KELUHAN", label: "Ada keluhan", detail: "Sampaikan yang Anda rasakan" },
] satisfies { value: BodyCondition; label: string; detail: string }[]

export function KioskQuestions({ onSave, onBack }: { onSave: (condition: BodyCondition, complaints: BodyComplaint[]) => void; onBack: () => void }) {
  const [condition, setCondition] = useState<BodyCondition | null>(null)
  const [complaints, setComplaints] = useState<BodyComplaint[]>([])
  const [error, setError] = useState("")
  function submit(event: FormEvent) {
    event.preventDefault()
    if (!condition || condition === "ADA_KELUHAN" && !complaints.length) { setError("Pilih keluhan yang Anda rasakan."); return }
    setError("")
    onSave(condition, condition === "BAIK" ? [] : complaints)
  }
  return <form onSubmit={submit} className="space-y-5">
    <fieldset><legend className="sr-only">Kondisi tubuh hari ini</legend><div className="condition-options">{conditions.map(option => <label key={option.value} data-selected={condition === option.value}><input type="radio" name="body-condition" checked={condition === option.value} onChange={() => { setCondition(option.value); setComplaints([]); setError("") }} /><HeartbeatIcon size={25} weight={condition === option.value ? "fill" : "regular"} /><strong>{option.label}</strong><small>{option.detail}</small></label>)}</div></fieldset>
    {condition && condition !== "BAIK" && <fieldset className="complaint-options"><legend>Keluhan yang dirasakan {condition === "KURANG_BUGAR" && "(bila ada)"}</legend>{BODY_COMPLAINTS.map(complaint => <label key={complaint}><input type="checkbox" checked={complaints.includes(complaint)} onChange={event => { setError(""); setComplaints(previous => event.target.checked ? [...previous, complaint] : previous.filter(value => value !== complaint)) }} />{complaint}</label>)}</fieldset>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="kiosk-device-note">Jawaban kondisi tubuh ditinjau HSE sebelum bekerja.</p>
    <Button type="submit" className="w-full" disabled={!condition}>Simpan absen & kondisi tubuh</Button>
    <Button type="button" variant="ghost" onClick={onBack}><ArrowLeftIcon />Ganti cara absen / pekerja</Button>
  </form>
}

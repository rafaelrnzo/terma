"use client"

import { useState } from "react"
import { SignOutIcon } from "@phosphor-icons/react/dist/csr/SignOut"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { OptionSelect } from "@/components/ui/option-select"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"

/** End-of-shift check-out: hours on site feed the daily heat dose, and late check-outs count as overtime. */
export function KioskCheckout() {
  const { state, dispatch } = useApp()
  const [code, setCode] = useState("")
  const shift = currentShift(state)
  const checkins = shift?.readiness?.checkins ?? []
  const open = state.pekerja.filter(worker => checkins.some(row => row.pekerjaKode === worker.kode && !row.pulang))
  const worker = open.find(row => row.kode === code)
  return <div className="space-y-5">
    <div className="kiosk-step-heading"><p className="eyebrow">ABSEN PULANG</p><h1>Selesai bekerja hari ini?</h1><p>Pilih nama Anda, lalu catat jam pulang.</p></div>
    {!open.length ? <p className="text-sm text-muted-foreground">Tidak ada pekerja yang perlu absen pulang. Pekerja perlu absen masuk terlebih dahulu.</p> : <>
      <div className="kiosk-worker-select"><Label htmlFor="kiosk-checkout">Siapa yang pulang? <span className="font-normal text-muted-foreground">· {open.length} belum absen pulang</span></Label><OptionSelect id="kiosk-checkout" value={worker ? code : ""} onValueChange={setCode} options={open.map(row => ({ value: row.kode, label: `${row.nama} · ${row.kode}`, keywords: row.kode }))} placeholder="Pilih nama / ID pekerja" searchPlaceholder="Cari nama atau ID pekerja…" /></div>
      <Button className="w-full" disabled={!worker} onClick={() => { if (worker) { dispatch({ type: "CATAT_PULANG", pekerjaKode: worker.kode }); setCode("") } }}><SignOutIcon />{worker ? `Catat pulang ${worker.nama}` : "Pilih nama pekerja"}</Button>
    </>}
  </div>
}

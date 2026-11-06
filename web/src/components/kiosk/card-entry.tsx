"use client"

import { useEffect, useRef, useState } from "react"
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/csr/IdentificationCard"
import { ContactlessPaymentIcon } from "@phosphor-icons/react/dist/csr/ContactlessPayment"
import { ArrowDownIcon } from "@phosphor-icons/react/dist/csr/ArrowDown"
import { Button } from "@/components/ui/button"
import { RFID_SCAN_SECONDS } from "@/lib/device-telemetry"

export function CardEntry({ name, code, onConfirm }: { name: string; code: string; onConfirm: () => void }) {
  const [scanning, setScanning] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  function tap() {
    if (scanning) return
    setScanning(true)
    timer.current = setTimeout(onConfirm, RFID_SCAN_SECONDS * 1000)
  }
  return <div className="kiosk-card-entry" data-scanning={scanning}>
    <div className="kiosk-worker-card" aria-hidden><div><span>TERMA / WORKER ID</span><ContactlessPaymentIcon size={24} /></div><IdentificationCardIcon size={38} /><strong>{name}</strong><small>{code}</small><div className="card-barcode" /></div>
    <ArrowDownIcon className="kiosk-tap-arrow" size={22} aria-hidden />
    <button className="kiosk-card-reader" onClick={tap} disabled={scanning} aria-label={`Tap kartu ${name} ke reader`}><span className="reader-rings" aria-hidden><i /><i /><i /></span><ContactlessPaymentIcon size={45} /><strong>{scanning ? "Membaca kartu…" : "Tap kartu di sini"}</strong><small>{scanning ? "Tunggu sampai pembacaan selesai" : "Seperti tap pada Water Station"}</small></button>
    <p className="kiosk-device-note" role="status">{scanning ? "Kartu sedang dibaca. Berikutnya isi kondisi tubuh." : "Pilih kartu pekerja di atas, lalu tekan reader atau tombol di bawah. Tap ini dijalankan melalui layar kios."}</p>
    <Button className="w-full" onClick={tap} disabled={scanning}><ContactlessPaymentIcon />{scanning ? "Membaca kartu…" : "Tap kartu & lanjut"}</Button>
  </div>
}

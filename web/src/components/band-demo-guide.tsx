"use client"

import Link from "next/link"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { Button } from "@/components/ui/button"
import { bandDemoGuide } from "@/lib/band-demo-guide"
import { useApp } from "@/lib/store"

export function BandDemoGuide({ onBack }: { onBack: () => void }) {
  const { state, user } = useApp()
  if (!user || user.role !== "ADMIN") return null
  const steps = bandDemoGuide(state, user)
  const next = steps.find(step => !step.complete)
  return <div className="flow-band-guide" aria-label="Panduan Band untuk Raya">
    <div className="flow-guide-heading"><h3>Band untuk Raya</h3><span>{steps.filter(step => step.complete).length}/{steps.length} siap</span></div>
    <p>Perangkat yang terhubung belum otomatis menjadi bacaan pekerja. Selesaikan pengaitan berikut satu kali per pemakaian Band.</p>
    <ol className="flow-guide-steps">{steps.map((step, index) => <li key={step.id} data-complete={step.complete} data-current={step.id === next?.id}>
      <span aria-label={step.complete ? "Selesai" : `Langkah ${index + 1}`}>{step.complete ? <CheckCircleIcon size={18} weight="fill" /> : index + 1}</span>
      <div><strong>{step.title}</strong>{step.id === next?.id && <><p>{step.description}</p><Button asChild size="sm" variant="outline"><Link href={step.href}>{step.action}</Link></Button></>}</div>
    </li>)}</ol>
    {!next && <p role="status">Bacaan Band aktual sudah tercatat untuk Raya. Tetap tempelkan sensor agar pembaruan berlanjut.</p>}
    <p className="flow-guide-note">Water Station: isi UID kartu Raya di Data pekerja, lalu tap kartu agar kunjungan minumnya masuk ke profil. Paparan panas mengikuti sumber pada rencana; bacaan Station dipakai pada interval 08.00–16.00.</p>
    <Button size="sm" variant="ghost" onClick={onBack}>Kembali ke pilihan alur</Button>
  </div>
}

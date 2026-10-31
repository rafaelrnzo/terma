"use client"

import Link from "next/link"
import { ArrowRightIcon, CheckCircleIcon, QuestionIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { ShiftOverview } from "@/components/shift-navigator"
import { GuideButton } from "@/components/workflow-guide"
import { Button } from "@/components/ui/button"
import { LABEL_PERAN } from "@/lib/access"
import { USERS } from "@/lib/config"
import { useApp } from "@/lib/store"
import { workflow } from "@/lib/workflow"
import { STEP_OUTCOMES } from "@/lib/workspace"

const roles = [
  { title: "1. Petugas data menyiapkan", description: "Periksa pekerja, penugasan, kehadiran, dan bacaan panas. Data siap diteruskan kepada HSE; petugas data tidak menyetujui rencana." },
  { title: "2. HSE mengambil keputusan", description: "Konfirmasi adaptasi, periksa batas dan jadwal setiap pekerja, setujui versi rencana, lalu catat pembagian instruksi kepada mandor." },
  { title: "3. Mandor melaksanakan, HSE menutup", description: "Mandor mengakui instruksi dan melaporkan menit aktual. HSE memeriksa laporan sebelum durasi terverifikasi masuk ke rekap." },
]

export default function PanduanPage() {
  const { state, user, dispatch } = useApp()
  if (!user) return null
  const steps = workflow(state, user)
  return <>
    <PageHeader title="Alur satu shift" summary="Mulai dari tugas peran Anda. Setiap langkah punya hasil yang jelas sebelum pekerjaan diteruskan ke peran berikutnya." />
    <div className="summon-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><QuestionIcon size={18} />Coba panduan interaktif</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Panduan membuka halaman sesuai peran dan menunjukkan tempat mengerjakan tugas. Panduan tidak mengubah data atau memberi persetujuan. Tutup kapan saja untuk mulai bekerja.</p></div><GuideButton mode="journey" label="Mulai panduan alur" /></div>
    <ShiftOverview />
    <div className="flow-role-list mb-6">{roles.map(role => <section key={role.title} className="summon-panel flow-role-card"><h2>{role.title}</h2><p>{role.description}</p></section>)}</div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]"><section className="summon-panel p-6"><h2 className="mb-4 text-sm font-semibold">Rincian langkah dan hasilnya</h2><ol className="flow-step-list">{steps.map(step => <li key={step.href}><div><strong>{step.label}</strong><p>{STEP_OUTCOMES[step.href]}</p><div className="flow-step-meta"><span className="text-muted-foreground">{step.peran.map(role => LABEL_PERAN[role]).join(" · ")}</span><span className={step.selesai ? "tone-success" : "text-muted-foreground"}>{step.selesai ? "Lengkap" : step.progress}</span><Link href={step.href} className="panel-link">Buka langkah<ArrowRightIcon size={13} /></Link></div></div></li>)}</ol></section><aside className="space-y-5"><section className="summon-panel p-5"><h2 className="text-sm font-semibold">Coba serah terima peran</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Pemilih ini khusus demo. Mengganti peran tidak mengubah status pekerjaan atau menyelesaikan tugas peran sebelumnya.</p><div className="mt-3 divide-y">{USERS.map(candidate => <div key={candidate.id} className="flex items-center justify-between gap-3 py-3"><span><strong className="block text-sm font-medium">{candidate.nama}</strong><small className="text-xs text-muted-foreground">{LABEL_PERAN[candidate.role]}{candidate.reguKode ? ` · ${candidate.reguKode}` : ""}</small></span><Button variant="outline" aria-pressed={candidate.id === user.id} onClick={() => dispatch({ type: "LOGIN", userId: candidate.id })}>{candidate.id === user.id ? <><CheckCircleIcon />Aktif</> : "Coba peran"}</Button></div>)}</div></section><section className="summon-panel p-5"><h2 className="text-sm font-semibold">Tiga hal yang berbeda</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-medium text-foreground">Dibagikan</strong>: HSE mencatat pembagian instruksi.<br /><strong className="font-medium text-foreground">Diakui</strong>: mandor mengonfirmasi penerimaan.<br /><strong className="font-medium text-foreground">Terverifikasi</strong>: HSE memeriksa laporan pelaksanaan.</p><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Data dan tindakan pada aplikasi ini adalah simulasi yang tersimpan di browser. Belum ada pengiriman WhatsApp, sinkronisasi akun, sensor langsung, atau diagnosis medis.</p></section></aside></div>
  </>
}

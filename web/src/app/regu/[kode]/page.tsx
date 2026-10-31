"use client"

import { use } from "react"
import Link from "next/link"
import { ShieldWarningIcon as ShieldAlert } from "@phosphor-icons/react"
import { PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { RencanaCard } from "@/components/rencana-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AksesDitolak, lihatRegu } from "@/lib/access"
import { REGU } from "@/lib/config"
import { rencanaAktif, useApp } from "@/lib/store"

export default function ReguPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params)
  const { state, user } = useApp()
  const regu = REGU.find((g) => g.kode === kode.toUpperCase())
  if (!user) return null
  if (!regu) return <><PageHeader title="Regu tidak ditemukan" /><WorkflowEmpty title="Periksa kode regu" href="/ringkasan" label="Kembali ke ringkasan">Kode regu ini tidak terdaftar di lokasi demo.</WorkflowEmpty></>

  try {
    // Same check the data layer uses for reads: a foreman outside this crew is refused here,
    // not by hiding a link.
    lihatRegu(user, regu.kode)
  } catch (e) {
    if (!(e instanceof AksesDitolak)) throw e
    return (
      <>
        <PageHeader title={regu.nama} />
        <Alert variant="destructive" className="bg-card">
          <ShieldAlert />
          <AlertTitle>Akses ditolak</AlertTitle>
          <AlertDescription>{e.message}</AlertDescription>
        </Alert>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.reguKode && (
            <Button asChild>
              <Link href={`/regu/${user.reguKode.toLowerCase()}`}>Buka regu Anda</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/ringkasan">Kembali ke Ringkasan</Link>
          </Button>
        </div>
      </>
    )
  }

  const kodePekerja = state.pekerja.filter((p) => p.reguKode === regu.kode).map((p) => p.kode)
  const rs = rencanaAktif(state).filter((r) => kodePekerja.includes(r.pekerjaKode))
  return (
    <>
      <PageHeader title={regu.nama}>Rencana aktif untuk {kodePekerja.length} pekerja di regu ini.</PageHeader>
      {rs.length === 0 ? (
        <p className="text-muted-foreground">Belum ada rencana untuk regu ini.</p>
      ) : (
        <div className="grid gap-6">
          {rs.map((r) => (
            <RencanaCard key={r.id} r={r} mode={user.role === "MANDOR" ? "mandor" : "hse"} />
          ))}
        </div>
      )}
    </>
  )
}

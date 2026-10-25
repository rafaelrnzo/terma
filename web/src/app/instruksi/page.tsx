"use client"

import { useRef, useState } from "react"
import { Copy, MessageSquare, Send, XCircle } from "lucide-react"
import { toast } from "sonner"
import { NextStep, PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { RoleHint } from "@/components/role-hint"
import { DeliveryBadge } from "@/components/status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { REGU } from "@/lib/config"
import { isiPesan, rencanaAktif, useApp, useIzin } from "@/lib/store"

const KANAL = ["WhatsApp", "SMS", "Disampaikan langsung"]

export default function InstruksiPage() {
  const { state, user } = useApp()
  const reguTerlihat = user?.role === "MANDOR" ? REGU.filter((g) => g.kode === user.reguKode) : REGU

  if (!state.rencanaDihitung)
    return (
      <>
        <PageHeader no="5" title="Instruksi mandor" />
        <WorkflowEmpty title="Instruksi menunggu rencana" href="/rencana" label="Buka rencana & persetujuan">Hitung dan setujui rencana terlebih dahulu. Instruksi per regu disusun dari versi yang sudah disetujui HSE.</WorkflowEmpty>
      </>
    )

  return (
    <>
      <PageHeader no="5" title="Instruksi mandor" peran="HSE membagikan · Mandor mengakui" summary="Bagikan rencana yang disetujui secara manual, lalu catat pembagian dan pengakuan mandor secara terpisah.">
        Ringkasan rencana yang sudah disetujui dibagikan ke mandor. TERMA belum terhubung ke kanal pesan, jadi HSE membagikannya sendiri
        (salin atau buka WhatsApp) lalu mencatatnya di sini. Statusnya DIBAGIKAN MANUAL, tidak pernah TERKIRIM tanpa bukti kanal. Pengakuan
        mandor di TERMA dicatat terpisah dan belum berarti tindakan terlaksana.
      </PageHeader>
      <RoleHint peran={user?.role === "MANDOR" ? ["MANDOR"] : ["HSE"]} />

      <div className="grid items-start gap-6">
        {reguTerlihat.map((g) => (
          <KartuRegu key={g.kode} reguKode={g.kode} />
        ))}
      </div>

      <NextStep href="/tindakan" label="Tindakan & verifikasi" />
    </>
  )
}

function KartuRegu({ reguKode }: { reguKode: string }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const [kanal, setKanal] = useState(KANAL[0])
  const g = REGU.find((r) => r.kode === reguKode)!
  const { teks, rencanaIds } = isiPesan(state, reguKode)
  const pekerjaRegu = state.pekerja.filter((p) => p.reguKode === reguKode).map((p) => p.kode)
  const belum = rencanaAktif(state).filter((r) => pekerjaRegu.includes(r.pekerjaKode) && !r.disetujuiOleh)
  const riwayat = state.pengiriman.filter((p) => p.reguKode === reguKode)
  const versiIni = riwayat.find((p) => p.id === `${reguKode}:${rencanaIds.join("+")}`)
  const terakhir = versiIni
  const bisaBagikan = izin("KIRIM_INSTRUKSI") && rencanaIds.length > 0 && versiIni?.status !== "DIBAGIKAN_MANUAL"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="size-4" /> {g.nama}</CardTitle>
        <CardDescription>Versi rencana: {rencanaIds.length ? rencanaIds.join(", ") : "Belum tersedia"}</CardDescription>
      </CardHeader>
      <CardContent className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
        {belum.length > 0 && (
          <Alert className="bg-background">
            <AlertTitle>{belum.length} rencana belum disetujui, tidak ikut dibagikan</AlertTitle>
            <AlertDescription>{belum.map((r) => r.id).join(", ")}</AlertDescription>
          </Alert>
        )}
        <div className="rounded-sm bg-background p-5">
          <h3 className="mb-3 text-sm font-medium">Isi instruksi</h3>
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {rencanaIds.length ? teks : <span className="text-muted-foreground">Belum ada rencana disetujui untuk regu ini.</span>}
          </div>
        </div>
        </div>
        <div className="space-y-5 border-t pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
        <div>
          <h3 className="text-sm font-semibold">Pembagian & penerimaan</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">TERMA belum terhubung ke kanal pesan. Pengakuan penerimaan belum berarti tindakan terlaksana.</p>
        </div>
        {izin("KIRIM_INSTRUKSI") && rencanaIds.length > 0 && (
          <div className="no-print space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(teks)
                    toast.success("Pesan disalin.")
                  } catch {
                    toast.error("Pesan belum tersalin. Pilih teks instruksi dan salin secara manual.")
                  }
                }}
              >
                <Copy /> Salin pesan
              </Button>
              {state.demo ? <Dialog><DialogTrigger asChild><Button variant="outline"><Send />Pratinjau WhatsApp</Button></DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Pratinjau pesan · {g.nama}</DialogTitle><DialogDescription>Simulasi saja. Tidak ada WhatsApp yang dibuka atau pesan yang dikirim. Gunakan Salin pesan untuk menyalin contoh secara manual.</DialogDescription></DialogHeader><div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-relaxed">{teks}</div></DialogContent></Dialog> : <Button variant="outline" asChild>
                <a href={`https://wa.me/?text=${encodeURIComponent(teks)}`} target="_blank" rel="noopener noreferrer">
                  <Send /> Buka di WhatsApp
                </a>
              </Button>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={kanal} onValueChange={setKanal}>
                <SelectTrigger className="w-52 bg-card" aria-label="Kanal yang dipakai"><SelectValue /></SelectTrigger>
                <SelectContent>{KANAL.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
              {versiIni?.status === "DIBAGIKAN_MANUAL" ? <p role="status" className="text-sm text-primary">Pembagian versi ini sudah dicatat.</p> : <Button disabled={!bisaBagikan} onClick={() => dispatch({ type: "BAGIKAN", reguKode, kanal })}>Catat sudah dibagikan</Button>}
            </div>
          </div>
        )}

        {terakhir && terakhir.status === "DIBAGIKAN_MANUAL" && (
          <div className="no-print flex flex-wrap gap-2">
            {izin("AKUI_PESAN", reguKode) && (
              terakhir.diakui ? <p className="text-sm text-primary">Penerimaan sudah diakui.</p> : <Button onClick={() => dispatch({ type: "AKUI", pengirimanId: terakhir.id })}>Akui penerimaan</Button>
            )}
            {izin("KIRIM_INSTRUKSI") && !terakhir.diakui && (
              <GagalTersampaikan pengirimanId={terakhir.id} reguKode={reguKode} />
            )}
          </div>
        )}

        {riwayat.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-sm font-medium">Riwayat pembagian</h3>
            {riwayat.map((k) => (
              <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(k.waktu).toLocaleString("id-ID")} · {k.id.split(":")[1]}
                  {k.status === "GAGAL" && k.buktiKanal && <span className="ml-2 font-sans text-destructive">{k.buktiKanal}</span>}
                </span>
                <span className="flex flex-wrap gap-2">
                  <DeliveryBadge status={k.status} />
                  {k.diakui && <span className="text-xs text-primary">DIAKUI</span>}
                </span>
              </div>
            ))}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}

function GagalTersampaikan({ pengirimanId, reguKode }: { pengirimanId: string; reguKode: string }) {
  const { dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [error, setError] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const close = () => { setOpen(false); setError(false); setAlasan(""); trigger.current?.focus() }
  const id = `gagal-${reguKode}`
  return <div className="w-full space-y-3">
    <Button ref={trigger} variant="outline" aria-expanded={open} aria-controls={id} onClick={() => open ? close() : setOpen(true)}><XCircle aria-hidden />Tandai gagal tersampaikan</Button>
    {open && <form id={id} className="space-y-3 rounded-md bg-background p-4" onSubmit={(event) => {
      event.preventDefault()
      if (!alasan.trim()) { setError(true); return }
      dispatch({ type: "TANDAI_GAGAL", pengirimanId, alasan: alasan.trim() })
      close()
    }}>
      <div className="space-y-2"><Label htmlFor={`${id}-alasan`}>Alasan pesan tidak sampai</Label><Textarea id={`${id}-alasan`} autoFocus value={alasan} onChange={(e) => { setAlasan(e.target.value); setError(false) }} aria-invalid={error} aria-describedby={`${id}-bantuan${error ? ` ${id}-error` : ""}`} placeholder="Jelaskan kendala pembagian kepada mandor" /></div>
      <p id={`${id}-bantuan`} className="text-xs leading-relaxed text-muted-foreground">Tindakan yang belum diakui kembali berstatus belum tersampaikan. Catatan pembagian tetap tersimpan.</p>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">Isi alasan agar kegagalan dapat ditelusuri.</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit">Simpan status gagal</Button><Button type="button" variant="outline" onClick={close}>Batal</Button></div>
    </form>}
  </div>
}

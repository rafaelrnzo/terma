"use client"

import { useRef, useState } from "react"
import { CopyIcon } from "@phosphor-icons/react/dist/csr/Copy"
import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/csr/WhatsappLogo"
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt"
import { ChecksIcon } from "@phosphor-icons/react/dist/csr/Checks"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock"
import { XCircleIcon as XCircle } from "@phosphor-icons/react/dist/csr/XCircle"
import { toast } from "sonner"
import { PageHeader, WorkflowEmpty } from "@/components/app-shell"
import { DeliveryBadge } from "@/components/status"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { REGU, USERS } from "@/lib/config"
import { currentShift } from "@/lib/management-state"
import { isiPesan, rencanaAktif, useApp, useIzin } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"

const WHATSAPP_SIMULASI = "WhatsApp · simulasi"
const waktuPesan = (value: string) => new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })

export default function InstruksiPage() {
  const { state: workspace, user } = useApp()
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  const crews = REGU.filter(crew => state.pekerja.some(worker => worker.reguKode === crew.kode))
  if (!state.rencanaDihitung) return <><PageHeader context title="Instruksi mandor" /><WorkflowEmpty title="Instruksi menunggu rencana" href="/rencana" label="Buka rencana & persetujuan">Setujui rencana sebelum membagikan instruksi.</WorkflowEmpty></>
  return <><PageHeader context title="Instruksi mandor" /><div data-guide="instructions" className="instruction-workspace">{crews.map(crew => <KartuRegu key={crew.kode} reguKode={crew.kode} />)}{!crews.length && <p className="page-empty">Belum ada peserta regu pada shift ini.</p>}</div></>
}

function KartuRegu({ reguKode }: { reguKode: string }) {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  const crew = REGU.find(row => row.kode === reguKode)!
  const foreman = USERS.find(row => row.id === crew.mandorId)!
  const { teks, rencanaIds } = isiPesan(state, reguKode)
  const workers = state.pekerja.filter(worker => worker.reguKode === reguKode)
  const pending = rencanaAktif(state).filter(plan => workers.some(worker => worker.kode === plan.pekerjaKode) && !plan.disetujuiOleh)
  const history = state.pengiriman.filter(row => row.reguKode === reguKode)
  const delivery = history.find(row => row.id === `${reguKode}:${rencanaIds.join("+")}`)
  const shared = !!delivery && delivery.status !== "GAGAL"
  const simulated = delivery?.kanal === WHATSAPP_SIMULASI
  const canSend = izin("KIRIM_INSTRUKSI") && rencanaIds.length > 0 && !shared && currentShift(workspace)?.status === "ACTIVE"
  const status = delivery?.diakui ? "Dikonfirmasi mandor" : shared ? simulated ? "Terkirim · simulasi" : "Pembagian tercatat" : delivery?.status === "GAGAL" ? "Gagal tersampaikan" : rencanaIds.length ? "Siap dikirim" : "Menunggu persetujuan"
  return <section className="instruction-card summon-panel" aria-label={`Instruksi ${crew.nama}`} data-crew={crew.kode}>
    <header className="instruction-heading"><div className="instruction-recipient"><span className="instruction-avatar" aria-hidden>{foreman.nama[0]}</span><div><h2>{crew.nama}</h2><p>{foreman.nama} · Mandor regu</p></div></div><span className="instruction-state" data-complete={shared} data-failed={delivery?.status === "GAGAL"}>{shared ? <ChecksIcon /> : <ClockIcon />}{status}</span></header>
    <div className="instruction-layout">
      <div className="instruction-preview"><div className="instruction-preview-heading"><span><WhatsappLogoIcon size={20} />Pratinjau WhatsApp</span><small>Simulasi pengiriman</small></div>
        <div className="instruction-chat"><span className="instruction-date">{new Date(state.tanggal+"T00:00:00Z").toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})}</span><div className="instruction-bubble" data-sent={shared}>{rencanaIds.length ? <><div className="instruction-message" tabIndex={0} aria-label={`Isi pesan ${crew.nama}`}>{teks.split("\n").map((line,index) => <p key={index}>{line}</p>)}</div><div className="instruction-message-meta">{shared ? <><span>{waktuPesan(delivery.waktu)}</span><ChecksIcon aria-label={delivery.diakui ? "Dikonfirmasi di TERMA" : "Pembagian tercatat"} /></> : <span>Draf · {rencanaIds.length} rencana disetujui</span>}</div></> : <p className="instruction-no-message">Pesan tersedia setelah rencana regu disetujui.</p>}</div></div>
      </div>
      <div className="instruction-dispatch"><div><span className="section-kicker">PENGIRIMAN INSTRUKSI</span><h3>{shared ? "Pesan sudah dibagikan" : "Siap bagikan ke mandor"}</h3></div>
        <ol className="instruction-progress"><li data-complete={rencanaIds.length > 0}><CheckCircleIcon /><div><strong>Rencana disetujui</strong><span>{rencanaIds.length} dari {workers.length} pekerja</span></div></li><li data-complete={shared}>{shared ? <ChecksIcon /> : <PaperPlaneTiltIcon />}<div><strong>{simulated && shared ? "Terkirim ke WhatsApp" : "Bagikan instruksi"}</strong><span>{shared ? `${simulated ? "Simulasi · " : "Tercatat · "}${waktuPesan(delivery.waktu)}` : "Pesan siap disalin dan dibagikan"}</span></div></li><li data-complete={!!delivery?.diakui}>{delivery?.diakui ? <CheckCircleIcon /> : <ClockIcon />}<div><strong>Konfirmasi mandor</strong><span>{delivery?.diakui ? `Dikonfirmasi ${foreman.nama} di TERMA` : "Menunggu penerimaan di TERMA"}</span></div></li></ol>
        {pending.length > 0 && <p className="instruction-pending" role="status">{pending.length} rencana belum disetujui dan belum masuk pesan.</p>}
        {delivery?.status === "GAGAL" && <p className="instruction-pending" role="alert">{delivery.buktiKanal || "Pesan belum tersampaikan. Kirim ulang setelah kendala ditangani."}</p>}
        {izin("KIRIM_INSTRUKSI") && <div className="instruction-send-actions"><Button className="whatsapp-send" disabled={!canSend} data-sent={shared} onClick={() => dispatch({ type: "BAGIKAN", reguKode, kanal: WHATSAPP_SIMULASI })}>{shared ? <ChecksIcon /> : <WhatsappLogoIcon size={20} />}{shared ? simulated || delivery.status === "TERKIRIM" ? "Terkirim" : "Sudah dibagikan" : delivery?.status === "GAGAL" ? "Kirim ulang WhatsApp" : "Kirim WhatsApp"}</Button><Button variant="outline" disabled={!rencanaIds.length} onClick={async () => { try { await navigator.clipboard.writeText(teks); toast.success("Pesan disalin. Siap ditempel ke WhatsApp.") } catch { toast.error("Pesan belum tersalin. Pilih dan salin isi pesan.") } }}><CopyIcon />Salin pesan</Button></div>}
        {shared && izin("AKUI_PESAN",reguKode) && !delivery.diakui && <Button className="whatsapp-send" onClick={() => dispatch({ type:"AKUI",pengirimanId:delivery.id })}><CheckCircleIcon />Konfirmasi penerimaan</Button>}
        <p className="sr-only" role="status" aria-live="polite">{shared ? simulated ? `Pesan terkirim ke ${foreman.nama} dalam simulasi.` : "Pembagian instruksi versi ini sudah tercatat." : "Simulasi pengiriman · tidak mengirim pesan ke nomor WhatsApp."}</p>
        {shared && izin("KIRIM_INSTRUKSI") && !delivery.diakui && <GagalTersampaikan pengirimanId={delivery.id} reguKode={reguKode} />}
      </div>
    </div>
    {!!history.length && <details className="instruction-history"><summary>Riwayat pengiriman <span>{history.length}</span></summary><div>{history.map(row => <div className="instruction-history-row" key={row.id}><div><strong>{new Date(row.waktu).toLocaleString("id-ID")}</strong><p>{row.kanal ?? "Pembagian manual"} · {row.id.split(":")[1]}</p>{row.status === "GAGAL" && row.buktiKanal && <p className="text-destructive">{row.buktiKanal}</p>}</div><span>{row.kanal === WHATSAPP_SIMULASI && row.status !== "GAGAL" ? <span className="instruction-state" data-complete><ChecksIcon />{row.diakui ? "Dikonfirmasi mandor" : "Terkirim · simulasi"}</span> : <DeliveryBadge status={row.status} />}</span></div>)}</div></details>}
  </section>
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

"use client"

import { toast } from "sonner"
import { CopyIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ConfirmAction } from "@/components/confirm-action"
import { isiPesan, useApp, useIzin } from "@/lib/store"
import { REGU, USERS } from "@/lib/config"
import { scopedWorkspace } from "@/lib/workspace"

export function ShiftInstructions() {
  const { state: workspace, user, dispatch } = useApp()
  const izin = useIzin()
  if (!user) return null
  const state = scopedWorkspace(workspace, user)
  const crews = REGU.filter(crew => state.pekerja.some(worker => worker.reguKode === crew.kode))
  return <div data-guide="instructions" className="space-y-4">{crews.map(crew => {
    const { teks, rencanaIds } = isiPesan(state, crew.kode)
    const delivery = state.pengiriman.find(row => row.id === `${crew.kode}:${rencanaIds.join("+")}` && row.status === "DIBAGIKAN_MANUAL")
    const foreman = USERS.find(person => person.id === crew.mandorId)
    return <article className="wizard-worker" key={crew.kode}><div className="wizard-worker-heading"><div><h3>{crew.nama}</h3><p>Mandor: {foreman?.nama} · {rencanaIds.length} rencana</p></div><p className="text-sm">{delivery?.diakui ? "Penerimaan diakui" : delivery ? `Menunggu ${foreman?.nama}` : "Belum dibagikan"}</p></div>
      <details open={!delivery || user.role === "MANDOR"}><summary className="cursor-pointer text-sm font-medium">Baca instruksi regu</summary><div className="wizard-message mt-3">{teks}</div></details>
      {!delivery && izin("KIRIM_INSTRUKSI") && <div className="mt-4"><p className="mb-3 text-sm text-muted-foreground">Salin dan bagikan pesan melalui kanal regu, lalu catat pembagiannya.</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(teks); toast.success("Instruksi disalin. Bagikan ke kanal regu.") } catch { toast.error("Pilih teks instruksi dan salin secara manual.") } }}><CopyIcon />Salin instruksi</Button><ConfirmAction label="Catat sudah dibagikan" title={`Instruksi ${crew.nama} sudah dibagikan?`} description="Catat setelah pesan benar-benar dibagikan. Mandor mengakui penerimaan secara terpisah." onConfirm={() => dispatch({ type: "BAGIKAN", reguKode: crew.kode, kanal: "Kanal regu (manual)" })} /></div></div>}
      {delivery && !delivery.diakui && izin("AKUI_PESAN", crew.kode) && <Button className="mt-4" onClick={() => dispatch({ type: "AKUI", pengirimanId: delivery.id })}>Saya sudah membaca instruksi</Button>}
      {delivery?.diakui && <p className="wizard-result mt-4"><CheckCircleIcon size={16} />Instruksi diterima. Berikutnya mandor mencatat pelaksanaan.</p>}
    </article>
  })}</div>
}

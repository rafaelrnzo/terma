"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { HeartbeatIcon } from "@phosphor-icons/react/dist/csr/Heartbeat"
import { Button } from "@/components/ui/button"
import { BASELINE_LABEL, BASELINE_VALIDITY_LABEL, CONDITION_LABEL, workerHealthHistory, type WorkerHealthRow } from "@/lib/worker-health"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { tanggalLabel } from "@/lib/workspace"

const WorkerBodyMonitor = dynamic(() => import("@/components/worker-body-monitor"), { loading: () => <div className="rounded-xl border p-5" role="status"><h3 className="font-semibold">Peta sinyal tubuh</h3><div className="mt-4 grid grid-cols-2 gap-4"><div className="skeleton-value h-80" /><div className="space-y-3">{Array.from({length:5},(_,i)=><div key={i} className="skeleton-value h-12" />)}</div></div></div> })

export function WorkerHealthDetail({ row, date }: { row: WorkerHealthRow; date: string }) {
  const { user } = useApp()
  if (!user || !["HSE", "KLINIK"].includes(user.role) || !row.health) return null
  return <Button asChild size="sm" variant="outline" aria-label={`Pantau kesehatan ${row.worker.nama}`}><Link href={`/pemantauan/${encodeURIComponent(row.worker.kode)}?tanggal=${encodeURIComponent(date)}`}><HeartbeatIcon aria-hidden />Pantau</Link></Button>
}

export function WorkerHealthContent({ row, date }: { row: WorkerHealthRow; date: string }) {
  const { state, user } = useApp()
  if (!user || !["HSE", "KLINIK"].includes(user.role) || !row.health) return null
  const { baseline, checkin, review } = row.health
  const history = workerHealthHistory(managementOf(state), user, row.worker.kode)
  return <div className="worker-health-content">
        <WorkerBodyMonitor code={row.worker.kode} date={date} />
        <div className="health-evidence-grid"><section className="summon-panel space-y-3 p-6" aria-label="Baseline pemeriksaan">
          <h3 className="font-semibold">Baseline pemeriksaan</h3>
          <p>{BASELINE_VALIDITY_LABEL[row.validity]}</p>
          {baseline && <><p className="font-medium">{BASELINE_LABEL[baseline.status]}</p><p className="text-muted-foreground">Diperiksa {tanggalLabel(baseline.tanggalPemeriksaan)} · berlaku sampai {tanggalLabel(baseline.berlakuSampai)}</p><p className="break-words">{baseline.pembatasan || "Tidak ada pembatasan yang dicatat pada dokumen."}</p><p className="break-words text-xs text-muted-foreground">Sumber: {baseline.sumber}</p></>}
          <Button asChild variant="outline" size="sm"><Link href={`/impor?tab=pemeriksaan&pekerja=${encodeURIComponent(row.worker.kode)}`}>Kelola baseline pekerja</Link></Button>
        </section>
        <section className="summon-panel space-y-3 p-6" aria-label="Kondisi dan tindak lanjut">
          <h3 className="font-semibold">Check-in & tindak lanjut</h3>
          <p>{checkin ? CONDITION_LABEL[checkin.kondisi] : row.checkedIn ? "Check-in tercatat. Jawaban kondisi hanya tersedia untuk Klinik." : "Belum ada check-in pada tanggal ini."}</p>
          {checkin && <><p>{checkin.keluhan.length ? checkin.keluhan.join(", ") : "Tidak ada keluhan yang dipilih."}</p><p className="text-xs text-muted-foreground">Dilaporkan pekerja · {new Date(checkin.waktu).toLocaleString("id-ID")}</p></>}
          <p>{review ? review.hasil === "TUNDA_PENUGASAN" ? "Penugasan ditunda" : "Tinjauan awal tercatat" : row.status === "DITINJAU" ? "Rencana disetujui HSE" : "Belum ditinjau HSE"}</p>
          {review && <><p className="break-words">{review.catatan}</p><p className="text-xs text-muted-foreground">Dicatat {new Date(review.waktu).toLocaleString("id-ID")}</p></>}
          {row.shift && <Button asChild variant="outline" size="sm"><Link href={`/shift/${encodeURIComponent(row.shift.id)}`}>Buka shift & tindak lanjut</Link></Button>}
        </section></div>
        <section className="summon-panel p-6" aria-label="Riwayat kondisi pekerja"><h3 className="mb-2 font-semibold">Riwayat shift terakhir</h3>{history.length ? <ol className="divide-y">{history.slice(0, 10).map(item => <li key={item.id} className="space-y-1 py-3"><Link className="font-medium text-primary underline underline-offset-4" href={`/shift/${encodeURIComponent(item.id)}`}>{tanggalLabel(item.tanggal)} · {item.nama}</Link><p>{item.checkin ? CONDITION_LABEL[item.checkin.kondisi] : item.checkedIn ? "Check-in tercatat" : "Belum check-in"}{item.checkin?.keluhan.length ? ` · ${item.checkin.keluhan.join(", ")}` : ""}</p><p className="text-xs text-muted-foreground">{item.review ? item.review.hasil === "TUNDA_PENUGASAN" ? "Penugasan ditunda" : "Ditinjau HSE" : item.approved ? "Rencana disetujui HSE" : "Rencana perlu ditinjau"}</p></li>)}</ol> : <p className="text-muted-foreground">Belum ada riwayat shift.</p>}</section>
      </div>
}

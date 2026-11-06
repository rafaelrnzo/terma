"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { currentShift } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { scopedWorkspace } from "@/lib/workspace"
import { readinessProgress } from "@/lib/worker-readiness"
import type { Pekerja } from "@/lib/types"

export const HEALTH_STATUS_LABEL = { TANPA_PEMBATASAN: "Tanpa pembatasan pada dokumen", DENGAN_PEMBATASAN: "Ada pembatasan kerja", PERLU_TINJAU: "Perlu tindak lanjut" }

function WorkerReview({ worker }: { worker: Pekerja }) {
  const { state, user, dispatch } = useApp()
  const [note, setNote] = useState("")
  const shift = currentShift(state)
  const readiness = shift?.readiness
  if (!readiness || user?.role !== "HSE") return null
  const checkin = readiness.checkins.find(row => row.pekerjaKode === worker.kode)
  const baseline = readiness.baselines.find(row => row.pekerjaKode === worker.kode)
  const review = readiness.reviews.find(row => row.pekerjaKode === worker.kode)
  const editable = shift.status === "DRAFT" && !state.rencana.some(plan => plan.disetujuiOleh)
  return <article className="health-review-worker"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold">{worker.nama} <span className="font-normal text-muted-foreground">· {worker.kode}</span></h3><span className="text-sm text-primary">{!checkin ? "Belum absen" : review?.hasil === "LANJUT_TINJAU_RENCANA" ? "Tinjauan awal tercatat" : review?.hasil === "TUNDA_PENUGASAN" ? "Penugasan ditunda" : "Menunggu tinjauan HSE"}</span></div><div className="health-evidence-grid"><div><p className="eyebrow">BASELINE PERUSAHAAN</p>{baseline ? <><strong>{HEALTH_STATUS_LABEL[baseline.status]}</strong><p>Pemeriksaan {baseline.tanggalPemeriksaan} · berlaku sampai {baseline.berlakuSampai}</p>{baseline.berlakuSampai < state.tanggal && <p className="text-destructive">Dokumen sudah kedaluwarsa pada tanggal shift.</p>}<p>{baseline.pembatasan || "Tidak ada pembatasan kerja yang dicatat pada ringkasan dokumen."}</p><p>Sumber: {baseline.sumber}</p></> : <><strong>Baseline belum tersedia</strong><p>Catat kekurangan data serta tindak lanjut. Jangan menganggap data kosong sebagai kondisi normal.</p></>}</div><div><p className="eyebrow">JAWABAN SAAT ABSEN</p><strong>{!checkin ? "Belum mengisi" : checkin.kondisi === "BAIK" ? "Merasa baik" : checkin.kondisi === "KURANG_BUGAR" ? "Kurang bugar" : "Ada keluhan"}</strong>{checkin && <><p>{checkin.keluhan.length ? checkin.keluhan.join(", ") : "Tidak ada keluhan yang dipilih."}</p><p>Dicatat {new Date(checkin.waktu).toLocaleString("id-ID")}</p></>}</div></div>{review && <p className="mb-3 text-sm text-muted-foreground">Tindak lanjut HSE: {review.catatan}</p>}{editable && checkin && <div className="space-y-3"><Label htmlFor={`health-review-${worker.kode}`}>Catatan tindak lanjut HSE</Label><Input id={`health-review-${worker.kode}`} value={note} onChange={event => setNote(event.target.value)} placeholder="Catat pembatasan, klarifikasi, atau koordinasi dengan klinik" maxLength={1000} /><div className="flex flex-wrap gap-2"><Button disabled={note.trim().length < 5} onClick={() => dispatch({ type: "TINJAU_KONDISI", pekerjaKode: worker.kode, hasil: "LANJUT_TINJAU_RENCANA", catatan: note })}>Simpan tinjauan awal</Button><Button variant="outline" disabled={note.trim().length < 5} onClick={() => dispatch({ type: "TINJAU_KONDISI", pekerjaKode: worker.kode, hasil: "TUNDA_PENUGASAN", catatan: note })}>Tunda penugasan & tindak lanjuti</Button></div></div>}</article>
}

export function ShiftHealthReview() {
  const { state, user } = useApp()
  const shift = currentShift(state)
  if (!shift || !user) return null
  if (!shift.readiness) return <p className="text-sm text-muted-foreground">Shift ini dibuat sebelum pencatatan kondisi awal tersedia. Riwayat tidak diisi ulang secara otomatis. Gunakan draft shift baru untuk alur absen dan tinjauan kondisi.</p>
  const scoped = scopedWorkspace(state, user)
  const progress = readinessProgress(scoped)
  return <section className="health-review" data-guide="health-checkin"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Absen & kondisi awal pekerja</h2><p className="mt-2 text-sm text-muted-foreground">{progress.checked}/{progress.total} sudah absen · {progress.reviewed}/{progress.total} ditinjau HSE</p></div>{user.role !== "MANDOR" && <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/kiosk">Buka layar absen pekerja</Link></Button>{user.role === "HSE" && <Button asChild variant="outline"><Link href="/kesehatan-awal">Kelola baseline perusahaan</Link></Button>}</div>}</div>
    {user.role === "HSE" ? <><p className="my-4 text-sm leading-relaxed text-muted-foreground">Tinjau ringkasan dokumen perusahaan dan jawaban pekerja. Tinjauan ini menjadi dasar pemeriksaan rencana; bukan diagnosis atau izin medis otomatis. Baseline yang diperbarui disalin hanya ke draft sebelum persetujuan.</p>{scoped.pekerja.map(worker => <WorkerReview key={worker.kode} worker={worker} />)}</> : <div className="mt-4 divide-y">{scoped.pekerja.map(worker => { const checkin = shift.readiness?.checkins.find(row => row.pekerjaKode === worker.kode); const review = shift.readiness?.reviews.find(row => row.pekerjaKode === worker.kode); return <div key={worker.kode} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><strong>{worker.nama}</strong><span>{!checkin ? "Belum absen" : review?.hasil === "LANJUT_TINJAU_RENCANA" ? "Sudah ditinjau HSE" : "Menunggu tindak lanjut HSE"}</span></div> })}</div>}
  </section>
}

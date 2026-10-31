"use client"

import Link from "next/link"
import { ShieldCheckIcon, ArrowUpRightIcon, FirstAidKitIcon, ClockIcon, ClipboardTextIcon } from "@phosphor-icons/react"
import { PageHeader } from "@/components/app-shell"
import { monthlyExposure } from "@/lib/exposure-review"
import { useApp } from "@/lib/store"

export default function ExposureReviewPage() {
  const { state, user } = useApp()
  if (!user) return null
  const rows = monthlyExposure(state, user)
  const total = rows.reduce((sum, row) => sum + row.verifiedMinutes, 0)
  const month = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(state.tanggal + "T00:00:00Z"))
  return <>
    <PageHeader title="Paparan & rujukan klinik" summary="Riwayat yang dapat ditelusuri untuk mendukung tindak lanjut bulanan. Durasi terverifikasi dipisahkan dari rencana dan laporan yang belum diperiksa." />
    <p className="eyebrow"><ClockIcon size={16} />PERIODE {month.toUpperCase()} · {user.role === "MANDOR" ? `REGU ${user.reguKode}` : "SELURUH LOKASI"}</p>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="summon-panel p-5"><p className="metric-label">Paparan terverifikasi</p><p className="metric-value">{total.toLocaleString("id-ID")}<span>menit</span></p><p className="metric-foot">Akumulasi pada periode terpilih</p></div><div className="summon-panel p-5"><p className="metric-label">Pekerja dengan verifikasi</p><p className="metric-value">{rows.filter(row => row.verifiedShifts > 0).length}<span>/ {rows.length}</span></p><p className="metric-foot">Sesuai lingkup akses pengguna</p></div><div className="summon-panel p-5"><p className="metric-label">Rujukan klinik otomatis</p><p className="mt-5 text-lg font-medium">Belum aktif</p><p className="metric-foot">Memerlukan MCU, persetujuan & validasi</p></div></div>
    <section className="summon-panel"><div className="panel-heading"><div><h2>Riwayat paparan per pekerja</h2><p>Durasi ini belum merupakan dosis panas atau skor risiko ginjal.</p></div><Link href="/tindakan" className="panel-link">Verifikasi pelaksanaan<ArrowUpRightIcon size={14} /></Link></div><div className="table-scroll" role="region" aria-label="Rekap paparan bulanan" tabIndex={0}><table className="worker-table"><thead><tr><th>Pekerja</th><th>Regu</th><th>Shift terverifikasi</th><th>Durasi terverifikasi</th><th>Tindak lanjut</th></tr></thead><tbody>{rows.map(row => <tr key={row.worker.kode}><td><Link href={`/pekerja/${row.worker.kode}`} className="font-medium">{row.worker.nama}</Link></td><td>{row.worker.reguKode}</td><td className="tabular-nums">{row.verifiedShifts}</td><td className="whitespace-nowrap tabular-nums">{row.verifiedShifts ? `${row.verifiedMinutes} menit` : "Belum ada verifikasi"}</td><td><Link href={`/insight?pekerja=${row.worker.kode}`} className="panel-link">Tinjau paparan<ArrowUpRightIcon size={13} /></Link></td></tr>)}</tbody></table></div>{!rows.length && <div className="page-empty">Belum ada pekerja dalam lingkup Anda.</div>}</section>
    <div className="mt-6 grid gap-5 md:grid-cols-2"><section className="summon-panel p-6"><div className="flex items-center gap-2"><FirstAidKitIcon size={20} className="text-primary" /><h2 className="text-sm font-semibold">Rencana modul kesehatan ginjal</h2></div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Proposal menggabungkan riwayat paparan dengan faktor risiko dari MCU untuk membantu klinik menyiapkan daftar rujukan bulanan. Integrasi ini dan model AI personal belum diimplementasikan.</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">TERMA membantu perencanaan dan rujukan. Diagnosis dan pemeriksaan fungsi ginjal tetap dilakukan dokter.</p></section><section className="summon-panel p-6"><div className="flex items-center gap-2"><ShieldCheckIcon size={20} className="text-primary" /><h2 className="text-sm font-semibold">Informasi medis memerlukan persetujuan</h2></div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Target proposal: mandor melihat instruksi tindakan; detail diagnosis dan obat hanya untuk klinik dengan persetujuan pekerja. Data MCU, diagnosis, dan obat tidak dikumpulkan pada demo ini.</p><Link href="/laporan" className="panel-link mt-4"><ClipboardTextIcon size={15} />Buka laporan & jejak aktivitas<ArrowUpRightIcon size={14} /></Link></section></div>
  </>
}

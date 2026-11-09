"use client"

import Link from "next/link"
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight"
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock"
import { monthlyExposure } from "@/lib/exposure-review"
import { useApp } from "@/lib/store"

export function MonthlyExposureReport() {
  const { state, user } = useApp()
  if (!user) return null
  const rows = monthlyExposure(state, user)
  const total = rows.reduce((sum, row) => sum + row.verifiedMinutes, 0)
  const month = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(state.tanggal + "T00:00:00Z"))
  return <>

    <p className="eyebrow"><ClockIcon size={16} />PERIODE {month.toUpperCase()} · {user.role === "MANDOR" ? `REGU ${user.reguKode}` : "SELURUH LOKASI"}</p>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="summon-panel p-5"><p className="metric-label">Paparan terverifikasi</p><p className="metric-value">{total.toLocaleString("id-ID")}<span>menit</span></p></div><div className="summon-panel p-5"><p className="metric-label">Pekerja dengan verifikasi</p><p className="metric-value">{rows.filter(row => row.verifiedShifts > 0).length}<span>/ {rows.length}</span></p></div><div className="summon-panel p-5"><p className="metric-label">Shift terverifikasi</p><p className="metric-value">{rows.reduce((sum,row)=>sum+row.verifiedShifts,0)}<span>catatan pekerja</span></p></div></div>
    <section className="summon-panel"><div className="panel-heading"><div><h2>Riwayat paparan per pekerja</h2><p>Dosis panas & rujukan ginjal: Klinik.</p></div><Link href="/tindakan" className="panel-link">Verifikasi pelaksanaan<ArrowUpRightIcon size={14} /></Link></div><div className="table-scroll" role="region" aria-label="Rekap paparan bulanan" tabIndex={0}><table className="worker-table"><thead><tr><th>Pekerja</th><th>Regu</th><th>Shift terverifikasi</th><th>Durasi terverifikasi</th><th>Tindak lanjut</th></tr></thead><tbody>{rows.map(row => <tr key={row.worker.kode}><td><Link href={["HSE","KLINIK","ADMIN"].includes(user.role) ? `/pemantauan/${row.worker.kode}?tanggal=${state.tanggal}` : `/pekerja/${row.worker.kode}`} className="font-medium">{row.worker.nama}</Link></td><td>{row.worker.reguKode}</td><td className="tabular-nums">{row.verifiedShifts}</td><td className="whitespace-nowrap tabular-nums">{row.verifiedShifts ? `${row.verifiedMinutes} menit` : "Belum ada verifikasi"}</td><td><Link href={["HSE","KLINIK","ADMIN"].includes(user.role) ? `/pemantauan/${row.worker.kode}?tanggal=${state.tanggal}` : `/pekerja/${row.worker.kode}?tab=analisis`} className="panel-link">Tinjau paparan<ArrowUpRightIcon size={13} /></Link></td></tr>)}</tbody></table></div>{!rows.length && <div className="page-empty">Belum ada pekerja dalam lingkup Anda.</div>}</section>

  </>
}

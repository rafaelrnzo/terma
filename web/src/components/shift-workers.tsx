"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRightIcon, MagnifyingGlassIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { QualityBadge, StatusChip } from "@/components/status"
import { lingkupPekerja } from "@/lib/access"
import { rencanaAktif, useApp } from "@/lib/store"
import { ZONA } from "@/lib/config"

export function ShiftWorkers() {
  const { state, user } = useApp()
  const [query, setQuery] = useState("")
  if (!user) return null
  const workers = lingkupPekerja(user, state.pekerja)
  const plans = rencanaAktif(state)
  const filtered = workers.filter(worker => `${worker.nama} ${worker.kode} ${worker.reguKode}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="summon-panel mt-6" aria-labelledby="workers-title">
    <div className="panel-heading"><div><h2 id="workers-title">Satu pekerja, satu rencana.</h2><p>Tindakan, sumber data, dan persetujuan dalam satu tampilan.</p></div><Link href="/rencana" className="panel-link">Semua rencana<ArrowUpRightIcon size={14} /></Link></div>
    <div className="worker-toolbar"><span className="flex items-center gap-2 text-xs text-muted-foreground"><UsersThreeIcon size={16} />{workers.length} pekerja dalam lingkup</span><div className="relative"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={16} /><Input aria-label="Cari pekerja di ringkasan" placeholder="Cari nama atau ID pekerja…" className="pl-9" value={query} onChange={event => setQuery(event.target.value)} /></div></div>
    <div className="table-scroll" role="region" aria-label="Rencana per pekerja" tabIndex={0}><table className="worker-table"><thead><tr><th>Pekerja</th><th>Zona kerja</th><th>Status tindakan</th><th>Batas harian</th><th>Sumber</th><th>Persetujuan</th></tr></thead><tbody>{filtered.map(worker => {
      const plan = plans.find(item => item.pekerjaKode === worker.kode)
      return <tr key={worker.kode}><td><Link className="worker-identity" href={`/pekerja/${worker.kode}`}><span className="worker-avatar">{worker.nama.slice(0, 2).toUpperCase()}</span><span><strong>{worker.nama}</strong><small>{worker.kode} · {worker.reguKode}</small></span></Link></td><td className="whitespace-nowrap text-muted-foreground">{ZONA.find(zone => zone.kode === plan?.zonaKode)?.nama.replace("Zona ", "").split(" (")[0] ?? "Belum ditugaskan"}</td><td>{plan ? <StatusChip status={plan.status} /> : "Belum dihitung"}</td><td className="whitespace-nowrap tabular-nums">{plan ? `${plan.batasHarianMenit} menit` : "—"}</td><td>{plan ? <QualityBadge kualitas={plan.kualitas} /> : "—"}</td><td className="whitespace-nowrap"><span className={plan?.disetujuiOleh ? "tone-success" : "text-muted-foreground"}>{plan?.disetujuiOleh ? "Disetujui HSE" : "Menunggu HSE"}</span></td></tr>
    })}</tbody></table></div>
    {!filtered.length && <div className="page-empty"><p>{workers.length ? "Tidak ada pekerja yang cocok dengan pencarian." : "Belum ada pekerja pada lingkup ini."}</p></div>}
  </section>
}

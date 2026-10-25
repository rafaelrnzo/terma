"use client"

import { JAM_SHIFT, ZONA } from "@/lib/config"
import { kualitasBacaan, jam } from "@/lib/rules"
import type { AppState } from "@/lib/store"
import type { ActionLifecycle, ActionStatus, Rencana, Tindakan } from "@/lib/types"

const statusRows: { key: ActionStatus; label: string; tone: string }[] = [
  { key: "RENCANA_TERSEDIA", label: "Rencana tersedia", tone: "blue" },
  { key: "ADAPTASI_DIPERLUKAN", label: "Adaptasi diperlukan", tone: "amber" },
  { key: "TINJAU_HSE", label: "Tinjau HSE", tone: "slate" },
  { key: "BATASI_ATAU_PINDAHKAN", label: "Batasi atau pindahkan", tone: "red" },
]

const lifecycleRows: { key: ActionLifecycle; label: string; tone: string }[] = [
  { key: "DIBUAT", label: "Dibuat", tone: "slate" },
  { key: "DISAMPAIKAN", label: "Disampaikan", tone: "slate" },
  { key: "DIAKUI", label: "Diakui", tone: "blue" },
  { key: "TINDAKAN_DILAPORKAN", label: "Dilaporkan", tone: "cyan" },
  { key: "TERVERIFIKASI", label: "Terverifikasi", tone: "blue" },
  { key: "BELUM_SELESAI", label: "Belum selesai", tone: "amber" },
]

function CountBars({ rows, total, empty }: { rows: { label: string; value: number; tone: string }[]; total: number; empty: string }) {
  if (!total) return <p className="report-chart-empty">{empty}</p>
  const max = Math.max(...rows.map(row => row.value), 1)
  return <dl className="report-bars">{rows.map(row => <div key={row.label} className="report-bar-row">
    <div className="report-bar-caption"><dt>{row.label}</dt><dd>{row.value}<span> / {total}</span></dd></div>
    <div className="report-bar-track" aria-hidden><span data-tone={row.tone} style={{ width: `${row.value ? Math.max(3, row.value / max * 100) : 0}%` }} /></div>
  </div>)}</dl>
}

const shortQuality: Record<string, string> = {
  TERUKUR: "T", REPLAY: "R", PRAKIRAAN_SAJA: "P", KEDALUWARSA: "K", TIDAK_TERSEDIA: "—",
}
const qualityLabel: Record<string, string> = {
  TERUKUR: "Terukur", REPLAY: "Replay", PRAKIRAAN_SAJA: "Prakiraan saja", KEDALUWARSA: "Kedaluwarsa", TIDAK_TERSEDIA: "Tidak tersedia",
}

export function ReportVisuals({ state, plans, actions }: { state: AppState; plans: Rencana[]; actions: Tindakan[] }) {
  const coverage = ZONA.map(zone => ({
    ...zone,
    hours: JAM_SHIFT.map(hour => ({ hour, quality: kualitasBacaan(zone.kode, state.tanggal, hour, state.bacaan, state.prakiraan).kualitas })),
  }))
  const valid = coverage.flatMap(zone => zone.hours).filter(item => item.quality === "TERUKUR" || item.quality === "REPLAY").length
  const intervalCount = ZONA.length * JAM_SHIFT.length

  return <section className="report-visuals" aria-label="Grafik ringkasan laporan">
    <div className="report-chart-grid">
      <article className="report-chart-panel">
        <div className="report-chart-heading"><div><h2>Status rencana aktif</h2><p>Satu status untuk setiap rencana pada tanggal terpilih.</p></div><strong>{plans.length}</strong></div>
        <CountBars rows={statusRows.map(row => ({ label: row.label, tone: row.tone, value: plans.filter(plan => plan.status === row.key).length }))} total={plans.length} empty="Belum ada rencana aktif. Status akan terlihat setelah rencana dibuat." />
      </article>
      <article className="report-chart-panel">
        <div className="report-chart-heading"><div><h2>Posisi tindak lanjut</h2><p>Status terkini dari tindakan yang masih berlaku.</p></div><strong>{actions.length}</strong></div>
        <CountBars rows={lifecycleRows.map(row => ({ label: row.label, tone: row.tone, value: actions.filter(action => action.status === row.key).length }))} total={actions.length} empty="Belum ada tindakan. Grafik terisi setelah rencana disetujui HSE." />
      </article>
    </div>
    <article className="report-chart-panel report-coverage-panel">
      <div className="report-chart-heading"><div><h2>Cakupan bacaan per zona</h2><p>Delapan interval kerja per zona. Huruf menunjukkan kualitas sumber, bukan tingkat risiko.</p></div><strong>{valid}<span> / {intervalCount}</span></strong></div>
      <div className="report-matrix-scroll" role="region" tabIndex={0} aria-label="Cakupan bacaan per zona, dapat digulir ke samping">
        <table className="report-matrix"><thead><tr><th scope="col">Zona</th>{JAM_SHIFT.map(hour => <th key={hour} scope="col" aria-label={jam(hour)}><span className="report-hour-full" aria-hidden>{jam(hour)}</span><span className="report-hour-short" aria-hidden>{String(hour).padStart(2, "0")}</span></th>)}</tr></thead>
          <tbody>{coverage.map(zone => <tr key={zone.kode}><th scope="row">{zone.nama.split(" (")[0]}</th>{zone.hours.map(item => <td key={item.hour}><span className="report-quality-cell" data-quality={item.quality} title={`${zone.nama}, ${jam(item.hour)}: ${qualityLabel[item.quality]}`}><span aria-hidden>{shortQuality[item.quality]}</span><span className="sr-only">{qualityLabel[item.quality]}</span></span></td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="report-quality-legend" aria-label="Keterangan kualitas bacaan">{["TERUKUR", "REPLAY", "PRAKIRAAN_SAJA", "KEDALUWARSA", "TIDAK_TERSEDIA"].map(quality => <span key={quality}><i className="report-quality-cell" data-quality={quality} aria-hidden>{shortQuality[quality]}</i>{qualityLabel[quality]}</span>)}</div>
    </article>
  </section>
}

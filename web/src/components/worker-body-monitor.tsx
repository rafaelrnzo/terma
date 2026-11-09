"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise"
import { DropIcon } from "@phosphor-icons/react/dist/csr/Drop"
import { HeartbeatIcon } from "@phosphor-icons/react/dist/csr/Heartbeat"
import { ShieldPlusIcon } from "@phosphor-icons/react/dist/csr/ShieldPlus"
import { ThermometerIcon } from "@phosphor-icons/react/dist/csr/Thermometer"
import { TimerIcon } from "@phosphor-icons/react/dist/csr/Timer"
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown"
import { Button } from "@/components/ui/button"
import { BODY_VIEWS } from "@/components/figures/worker-body/generated"
import { bodyMonitoring, type BodyRegion } from "@/lib/body-monitoring"
import { exampleBodyMonitoring } from "@/lib/body-monitoring-example"
import { useApp } from "@/lib/store"

const icons = { heat: ThermometerIcon, hydration: DropIcon, band: HeartbeatIcon, kidneys: ShieldPlusIcon, exposure: TimerIcon }
const toneLabel = { attention: "Perlu ditinjau", recorded: "Tercatat", unknown: "Belum tersedia" }

export default function WorkerBodyMonitor({ code, date }: { code: string; date: string }) {
  const { state, user } = useApp()
  const [selected, setSelected] = useState<BodyRegion>("heat")
  const [view, setView] = useState<"front" | "back">("front")
  const [clock, setClock] = useState(() => Date.now())
  const [source, setSource] = useState<"saved" | "example" | null>(null)
  const root = useRef<HTMLElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(true)
  const savedModel = user ? bodyMonitoring(state, user, code, date, clock) : null
  const showExample = source === "example" || (source === null && !!savedModel?.signals.every(signal => signal.tone === "unknown"))
  const model = savedModel && user ? showExample ? exampleBodyMonitoring(code, date, user.role === "KLINIK" || user.role === "ADMIN") : savedModel : null
  const hasModel = !!model
  useEffect(() => {
    const target = root.current
    if (!target) return
    let inView = true
    const sync = () => setVisible(inView && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    observer.observe(target)
    document.addEventListener("visibilitychange", sync)
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync) }
  }, [hasModel])
  useEffect(() => {
    if (!visible) return
    const tick = () => { if (!document.hidden) setClock(Date.now()) }
    const timer = setInterval(tick, 30000)
    document.addEventListener("visibilitychange", tick)
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick) }
  }, [visible])
  useLayoutEffect(() => {
    const element = list.current, thumb = indicator.current
    if (!element || !thumb) return
    const place = () => {
      const button = element.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (!button) return
      thumb.style.transform = `translateY(${button.offsetTop}px)`
      thumb.style.height = `${button.offsetHeight}px`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(element)
    return () => observer.disconnect()
  }, [selected, hasModel, showExample])
  if (!model) return null
  const active = model.signals.find(signal => signal.key === selected)!
  const geometry = BODY_VIEWS[view]
  const headline = model.signals.filter(signal => (user?.role === "KLINIK" || user?.role === "ADMIN" ? ["heat", "hydration", "band", "exposure"] : ["heat", "hydration", "exposure"]).includes(signal.key))
  return <section ref={root} className="body-monitor" aria-label="Peta sinyal tubuh pekerja" data-visible={visible}>
    <header className="body-monitor-heading"><div><h2>Pemantauan pekerja</h2><span className="monitor-source">{showExample ? "Ilustrasi · 13.40 WIB" : "Data tersimpan"}</span></div><Button size="sm" variant="outline" onClick={() => setSource(showExample ? "saved" : "example")}>{showExample ? "Lihat data tersimpan" : "Lihat ilustrasi"}</Button></header>
    <div className="health-metric-strip" data-count={headline.length}>{headline.map(signal => {
      const metric = signal.metrics?.[0]
      const Icon = icons[signal.key]
      return <button key={signal.key} onClick={() => setSelected(signal.key)} data-tone={signal.tone} aria-label={`Lihat ${signal.title}`}><div><span>{metric?.label ?? signal.title}</span><Icon size={20} /></div><strong>{metric?.value ?? "—"}<small>{metric?.unit}</small></strong><span className="metric-context">{signal.key === "hydration" ? `Target ${signal.metrics?.[1]?.value ?? "—"} menit` : signal.key === "exposure" ? `${signal.metrics?.[1]?.label ?? "Alokasi"} ${signal.metrics?.[1]?.value ?? "—"} menit` : signal.key === "band" && signal.metrics?.[2]?.value !== "—" && signal.metrics?.[2]?.label === "Estimasi suhu inti" ? `Estimasi Tc ${signal.metrics[2].value} °C` : metric?.note ?? toneLabel[signal.tone]}</span></button>
    })}</div>
    <div className="body-monitor-grid">
      <div className="body-map-card iso" data-selected-region={selected}>
        <div className="body-map-toolbar"><span>{view === "front" ? "Tampak depan" : "Tampak belakang"}</span><Button size="sm" variant="ghost" onClick={() => setView(previous => previous === "front" ? "back" : "front")}><ArrowClockwiseIcon aria-hidden />Putar tubuh</Button></div>
        <svg viewBox="0 0 480 610" className="iso-svg body-svg" role="group" aria-label="Manekin anatomi isometrik dengan lima marker interaktif">
          <g dangerouslySetInnerHTML={{ __html: geometry.art }} />
          {model.signals.map(signal => {
            const [x, y] = geometry.anchors[signal.key]
            return <g key={signal.key} className="body-marker" data-tone={signal.tone} data-selected={selected === signal.key} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`${signal.title}: ${signal.value}. ${toneLabel[signal.tone]}`} aria-pressed={selected === signal.key} onClick={() => setSelected(signal.key)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(signal.key) } }}><title>{signal.title} · {signal.value}</title><circle className="body-marker-hit" r="33" /><circle className="body-marker-halo" r="20" /><circle className="body-marker-ring" r="12" /><circle className="body-marker-dot" r="5" /></g>
          })}
        </svg>
        <div className="body-map-footer">Panas · hidrasi · respons tubuh</div>
      </div>
      <div className="body-signal-column"><div ref={list} className="body-signal-list" aria-label="Sinyal pemantauan"><span ref={indicator} className="body-signal-indicator" aria-hidden />{model.signals.map(signal => {
        const Icon = icons[signal.key]
        return <button key={signal.key} type="button" className="body-signal-button" aria-pressed={selected === signal.key} data-active={selected === signal.key} data-tone={signal.tone} onClick={() => setSelected(signal.key)}><span className="selectable-icon"><Icon className="icon-outline" size={18} aria-hidden /><Icon className="icon-fill" size={18} weight="fill" aria-hidden /></span><span><strong>{signal.title}</strong><small>{signal.value}</small></span><span className="signal-dot" aria-label={toneLabel[signal.tone]} /></button>
      })}</div>
        <section className="body-signal-detail" aria-live="polite" aria-atomic="true" key={`${selected}:${showExample}`}><div className="signal-detail-heading"><h3>{active.title}</h3><span data-tone={active.tone}>{toneLabel[active.tone]}</span></div><dl className="signal-metrics">{active.metrics?.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}<small>{metric.unit}</small></dd>{metric.note && <p>{metric.note}</p>}</div>)}</dl>
          {selected === "band" && !!model.bandTrend.length && <CoreTrend points={model.bandTrend} />}
          <p className="body-signal-action">{active.action}</p><p className="signal-source">{active.source}{active.observedAt && ` · ${new Date(active.observedAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}`}</p>
          <details className="signal-provenance"><summary>Sumber & metode<CaretDownIcon size={14} /></summary><p>{active.explanation}</p><dl><div><dt>Sumber</dt><dd>{active.source}</dd></div>{active.observedAt && <div><dt>Waktu</dt><dd>{new Date(active.observedAt).toLocaleString("id-ID")}</dd></div>}</dl></details>
        </section>
      </div>
    </div>
    {model.clinicalNote && <p className="body-clinical-note"><strong>Privat Klinik:</strong> {model.clinicalNote}</p>}
    {showExample && <footer className="body-monitor-caption">Data ilustrasi · tidak masuk perhitungan atau laporan shift.</footer>}
  </section>
}

function CoreTrend({ points }: { points: { minute: number; value: number }[] }) {
  const min = Math.min(37, ...points.map(point => point.value))
  const max = Math.max(38, ...points.map(point => point.value))
  const path = points.map((point, index) => `${index ? "L" : "M"}${20 + index / Math.max(1, points.length - 1) * 360},${90 - (point.value - min) / (max - min) * 70}`).join(" ")
  return <div className="core-trend"><p>Estimasi suhu inti <span>Model pilot · °C</span></p><svg viewBox="0 0 400 115" role="img" aria-label={`Tren estimasi suhu inti selama ${points.length} menit`}><line x1="20" x2="380" y1="90" y2="90" stroke="var(--border)" /><path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" /><text x="20" y="110">0 mnt</text><text x="380" y="110" textAnchor="end">{points.length} mnt</text></svg></div>
}

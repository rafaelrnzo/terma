"use client"

import { useEffect, useRef, useState } from "react"
import { PauseIcon as Pause, PlayIcon as Play, ArrowCounterClockwiseIcon as RotateCcw } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const steps = [
  { title: "HSE menyiapkan rencana", description: "Tinjau data panas dan kebutuhan tiap pekerja.", document: "Rencana kerja-istirahat", detail: "Batas paparan dan jadwal diperiksa sebelum disetujui.", owner: "Petugas HSE", output: "Rencana ditinjau" },
  { title: "Mandor melaksanakan", description: "Terima instruksi, lalu catat durasi kerja aktual.", document: "Catatan pelaksanaan", detail: "Mandor mencatat tindakan dan durasi aktual untuk regunya.", owner: "Mandor regu", output: "Pelaksanaan dicatat" },
  { title: "HSE memverifikasi", description: "Periksa laporan sebelum menutup tindakan.", document: "Hasil verifikasi shift", detail: "Laporan diperiksa HSE dan hasilnya masuk ke rekap shift.", owner: "Petugas HSE", output: "Laporan diperiksa" },
]

export function LandingHandoff() {
  const root = useRef<HTMLElement>(null)
  const autoStarted = useRef(false)
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncPreference = () => {
      setReduced(preference.matches)
      if (preference.matches) setPlaying(false)
    }
    syncPreference()
    setReady(true)
    preference.addEventListener("change", syncPreference)
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false)
      else if (!autoStarted.current && !preference.matches && !document.hidden) {
        autoStarted.current = true
        setPlaying(true)
      }
    }, { threshold: 0.35 })
    if (root.current) observer.observe(root.current)
    const onVisibility = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      observer.disconnect()
      preference.removeEventListener("change", syncPreference)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!playing || reduced) return
    const timer = window.setTimeout(() => {
      if (active < steps.length - 1) setActive(active + 1)
      else setPlaying(false)
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [active, playing, reduced])

  const select = (index: number) => {
    autoStarted.current = true
    setPlaying(false)
    setActive(index)
  }
  const current = steps[active]

  return <aside ref={root} className="intro-handoff handoff-demo" aria-label="Contoh alur koordinasi" data-playing={playing}>
    <div className="handoff-heading"><h2 className="font-heading text-2xl font-medium">Satu rencana,<br />sampai selesai di lapangan.</h2><span className="handoff-counter" aria-hidden>{active + 1}<span> / 3</span></span></div>
    <p className="mt-3 text-sm text-muted-foreground">Contoh alur dalam simulasi. Pilih tahap untuk menjelajah.</p>
    <ol className="handoff-list">{steps.map((step, index) => <li key={step.title} data-passed={index < active}>
      <button type="button" className="handoff-step" aria-pressed={active === index} aria-controls="handoff-output" onClick={() => select(index)}>
        <span className="handoff-node" aria-hidden>{index + 1}</span><span><span className="block font-medium">{step.title}</span><span className="mt-1 block text-sm text-muted-foreground">{step.description}</span></span>
      </button>
    </li>)}</ol>
    <div id="handoff-output" className="handoff-receipt" aria-live="off">
      <div className="handoff-receipt-content" key={active}>
        <h3 className="font-heading text-lg font-medium">{current.document}</h3>
        <p className="handoff-receipt-detail">{current.detail}</p>
        <div className="handoff-receipt-footer"><span>{current.owner}</span><span className="handoff-output-label">{current.output}</span></div>
      </div>
    </div>
    <div className="handoff-controls"><p className="text-xs leading-relaxed text-muted-foreground">Ilustrasi saja.<br />Tidak mengubah data demo.</p>
      {ready && !reduced ? <Button variant="ghost" size="sm" onClick={() => {
        autoStarted.current = true
        if (playing) setPlaying(false)
        else { setActive(0); setPlaying(true) }
      }}>{playing ? <><Pause aria-hidden />Jeda animasi</> : active === 2 ? <><RotateCcw aria-hidden />Ulangi alur</> : <><Play aria-hidden />Putar alur</>}</Button> : <span className="text-xs text-muted-foreground">3 tahap koordinasi</span>}
    </div>
  </aside>
}

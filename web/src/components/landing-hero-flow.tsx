"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ClipboardCheck, Pause, Play, RadioTower, Send } from "lucide-react"

const steps = [
  { title: "Bacaan zona", description: "Periksa sumber dan jam bacaan sebelum menyusun rencana.", label: "Kualitas bacaan", value: "REPLAY", detail: "Rekaman contoh dibedakan dari pengukuran langsung.", icon: RadioTower },
  { title: "Rencana HSE", description: "Tinjau batas dan jadwal kerja-istirahat setiap pekerja.", label: "Tahap rencana", value: "TINJAU HSE", detail: "Rencana perlu diperiksa sebelum disetujui.", icon: ClipboardCheck },
  { title: "Instruksi regu", description: "Mandor menerima instruksi dan melaporkan pelaksanaan.", label: "Tindak lanjut", value: "MENUNGGU CATATAN", detail: "Catatan pelaksanaan menjadi dasar verifikasi HSE.", icon: Send },
]

export function LandingHeroFlow() {
  const root = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => { setReduced(preference.matches); if (preference.matches) setPlaying(false) }
    sync()
    setReady(true)
    preference.addEventListener("change", sync)
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false)
      else if (!started.current && !preference.matches && !document.hidden) { started.current = true; setPlaying(true) }
    }, { threshold: 0.45 })
    if (root.current) observer.observe(root.current)
    const onVisibility = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener("visibilitychange", onVisibility)
    return () => { observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", onVisibility) }
  }, [])

  useEffect(() => {
    if (!playing || reduced) return
    const timer = window.setTimeout(() => {
      if (active < steps.length - 1) setActive(active + 1)
      else setPlaying(false)
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [active, playing, reduced])

  const select = (index: number) => { started.current = true; setPlaying(false); setActive(index) }
  const current = steps[active]

  return <div ref={root} className="hero-flow" role="group" aria-label="Ilustrasi interaktif alur TERMA" data-playing={playing} data-step={active}>
    <div className="hero-flow-steps" aria-label="Pilih tahap alur">{steps.map((step, index) => {
      const Icon = step.icon
      return <button key={step.title} type="button" aria-pressed={active === index} aria-controls="hero-flow-output" onClick={() => select(index)} className="hero-flow-step"><span className="hero-flow-node" aria-hidden>{active > index ? <Check size={15} /> : <Icon size={17} />}</span><span>{step.title}</span></button>
    })}</div>
    <div className="hero-flow-output" id="hero-flow-output">
      <div className="hero-flow-output-top"><span>Contoh alur kerja</span><span>{active + 1} / {steps.length}</span></div>
      <div className="hero-flow-output-body" key={active}><div><p>{current.label}</p><strong>{current.value}</strong><span>{current.detail}</span></div><div className="hero-flow-mini" aria-hidden><i /><i /><i /></div></div>
      <p className="hero-flow-description">{current.description}</p>
    </div>
    <div className="hero-flow-controls"><span>Ilustrasi · tidak mengubah data demo</span>{ready && !reduced && <button type="button" onClick={() => { started.current = true; if (playing) setPlaying(false); else { setActive(0); setPlaying(true) } }}>{playing ? <><Pause size={14} aria-hidden />Jeda</> : <><Play size={14} aria-hidden />Putar ulang</>}</button>}</div>
  </div>
}

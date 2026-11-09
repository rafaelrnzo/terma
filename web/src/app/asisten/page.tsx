"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock"
import { PaperPlaneRightIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneRight"
import { SparkleIcon } from "@phosphor-icons/react/dist/csr/Sparkle"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DEMO_BRIEFINGS, DEMO_EVIDENCE, DEMO_PROMPTS, briefingKindFor, type BriefingKind } from "@/lib/ai-briefing-demo"

type BriefingResult = { question: string; kind: BriefingKind }

const STEPS = ["Membaca cuplikan shift", "Menyusun prioritas", "Memeriksa rujukan"]

export default function AssistantPage() {
  const [question, setQuestion] = useState("")
  const [pendingQuestion, setPendingQuestion] = useState("")
  const [phase, setPhase] = useState(-1)
  const [result, setResult] = useState<BriefingResult | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function submit(value: string) {
    const trimmed = value.trim().slice(0, 160)
    if (!trimmed || phase >= 0) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setQuestion("")
    setPendingQuestion(trimmed)
    setResult(null)
    setPhase(0)
    const kind = briefingKindFor(trimmed)
    const finish = kind === "bantuan" ? 1050 : 2900 + Math.min(trimmed.length * 7, 420)
    if (kind !== "bantuan") {
      timers.current.push(setTimeout(() => setPhase(1), 950))
      timers.current.push(setTimeout(() => setPhase(2), 2050))
    }
    timers.current.push(setTimeout(() => {
      setResult({ question: trimmed, kind })
      setPendingQuestion("")
      setPhase(-1)
      requestAnimationFrame(() => resultRef.current?.focus())
    }, finish))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(question)
  }

  const briefing = result ? DEMO_BRIEFINGS[result.kind] : null

  return <div className="assistant-page">
    <div className="page-title-row"><PageHeader title="Asisten shift" summary="Baca sinyal penting sebelum mengambil keputusan operasional." /><span className="assistant-demo-pill"><span aria-hidden /> Simulasi AI</span></div>

    <section className="assistant-intro" aria-label="Tentang asisten shift">
      <div className="assistant-intro-mark" aria-hidden><SparkleIcon size={26} weight="fill" /></div>
      <div><h2>Briefing yang langsung ke inti.</h2><p>Tanyakan prioritas shift, kehadiran, atau bacaan panas. Asisten menyusun jawaban contoh dari satu skenario yang sama.</p></div>
      <div className="assistant-intro-meta"><span>Skenario demo</span><strong>Shift pagi · Zona Barat</strong><small>Angka dan jawaban di halaman ini adalah simulasi.</small></div>
    </section>

    <div className="assistant-layout">
      <section className="assistant-workspace" aria-labelledby="assistant-workspace-heading">
        <div className="assistant-workspace-header"><div><h2 id="assistant-workspace-heading">Tanya asisten</h2><p>Mulai dari salah satu pertanyaan berikut atau tulis sendiri.</p></div><span className="assistant-capability">3 topik demo</span></div>
        <div className="assistant-prompts" aria-label="Contoh pertanyaan">
          {DEMO_PROMPTS.map(prompt => <button key={prompt.kind} type="button" disabled={phase >= 0} onClick={() => submit(prompt.label)}>{prompt.label}<ArrowRightIcon size={16} aria-hidden /></button>)}
        </div>
        <form className="assistant-composer" onSubmit={onSubmit}>
          <label htmlFor="assistant-question">Pertanyaan Anda</label>
          <div className="assistant-input-wrap"><Textarea id="assistant-question" value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(question) } }} maxLength={160} placeholder="Contoh: Apa prioritas shift pagi ini?" rows={2} disabled={phase >= 0} /><Button type="submit" disabled={!question.trim() || phase >= 0} aria-label="Kirim pertanyaan"><PaperPlaneRightIcon size={18} /> <span>Kirim</span></Button></div>
          <p>Jawaban berasal dari contoh tetap, tanpa koneksi ke model AI atau data operasional live.</p>
        </form>

        <div className="assistant-answer" ref={resultRef} tabIndex={-1} aria-live="polite">
          {phase >= 0 ? <div className="assistant-thinking" role="status">
            <div className="assistant-answer-top"><span className="assistant-orb" aria-hidden><SparkleIcon size={18} weight="fill" /></span><div><strong>Menyiapkan briefing</strong><p>{pendingQuestion}</p></div><ClockIcon size={18} aria-hidden /></div>
            <ol className="assistant-steps">{STEPS.map((step, index) => <li key={step} data-state={index < phase ? "done" : index === phase ? "active" : "waiting"}><span className="assistant-step-dot" aria-hidden>{index < phase ? <CheckCircleIcon size={16} weight="fill" /> : null}</span>{step}</li>)}</ol>
            <div className="assistant-skeleton" aria-hidden><span /><span /><span /></div>
          </div> : briefing && result ? <article className="assistant-result">
            <div className="assistant-question-line"><span>Anda bertanya</span><p>{result.question}</p></div>
            <div className="assistant-result-head"><span className="assistant-orb" aria-hidden><SparkleIcon size={18} weight="fill" /></span><div><h3>{briefing.title}</h3><span className="assistant-result-status">Briefing contoh · selesai</span></div><button type="button" onClick={() => submit(result.question)} aria-label="Ulangi briefing" title="Ulangi briefing"><ArrowClockwiseIcon size={18} /></button></div>
            <p className="assistant-result-summary">{briefing.summary}</p>
            {briefing.points.length > 0 && <ol className="assistant-findings">{briefing.points.map((point, index) => <li key={point.label}><span className="assistant-finding-index">{String(index + 1).padStart(2, "0")}</span><div><h4>{point.label}</h4><p>{point.text}</p><small>{point.source}</small></div></li>)}</ol>}
            <p className="assistant-result-note">Simulasi untuk melihat alur kerja. Verifikasi data aktual dan keputusan tetap dilakukan petugas berwenang.</p>
          </article> : <div className="assistant-empty"><span className="assistant-empty-icon" aria-hidden><SparkleIcon size={26} /></span><h3>Briefing menunggu pertanyaan</h3><p>Hasil akan muncul di sini bersama prioritas dan rujukan data contoh.</p></div>}
        </div>
      </section>

      <aside className="assistant-context" aria-label="Cuplikan data simulasi">
        <div className="assistant-context-heading"><div><h2>Cuplikan skenario</h2><p>Data yang dipakai dalam jawaban demo.</p></div><span>Contoh</span></div>
        <div className="assistant-context-data"><div className="assistant-context-main"><span>WBGT · Zona Barat</span><strong>29,1 <small>°C</small></strong><p>09.20 · naik 1,2 °C dari 07.00</p></div>{DEMO_EVIDENCE.slice(1).map(item => <div className="assistant-context-row" key={item.label}><span>{item.label}</span><div><strong>{item.value}</strong><small>{item.detail}</small></div></div>)}</div>
        <div className="assistant-context-foot"><span className="assistant-context-live" aria-hidden /> <strong>Mode simulasi aktif</strong><p>Cuplikan ini tetap sama saat Anda mencoba pertanyaan. Belum membaca data dari sensor atau akun pekerja.</p></div>
      </aside>
    </div>
  </div>
}

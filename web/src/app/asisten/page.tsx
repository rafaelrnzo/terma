"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { PaperPlaneRightIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneRight"
import { SparkleIcon } from "@phosphor-icons/react/dist/csr/Sparkle"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DEMO_BRIEFINGS, DEMO_EVIDENCE, DEMO_PROMPTS, briefingKindFor, type BriefingKind } from "@/lib/ai-briefing-demo"

type Message = { id: number; role: "user"; text: string } | { id: number; role: "assistant"; kind: BriefingKind }
const STEPS = ["Membaca konteks shift", "Menyusun jawaban", "Memeriksa rujukan"]

export default function AssistantPage() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [phase, setPhase] = useState(-1)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const nextId = useRef(0)
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    feed.scrollTo({ top: feed.scrollHeight, behavior: reduced ? "auto" : "smooth" })
  }, [messages, phase])

  function submit(value: string) {
    const trimmed = value.trim().slice(0, 160)
    if (!trimmed || phase >= 0) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setQuestion("")
    setMessages(previous => [...previous, { id: ++nextId.current, role: "user", text: trimmed }])
    setPhase(0)
    const kind = briefingKindFor(trimmed)
    const finish = kind === "bantuan" ? 1100 : 2400 + Math.min(trimmed.length * 8, 600)
    if (kind !== "bantuan") {
      timers.current.push(setTimeout(() => setPhase(1), 800))
      timers.current.push(setTimeout(() => setPhase(2), 1700))
    }
    timers.current.push(setTimeout(() => {
      setMessages(previous => [...previous, { id: ++nextId.current, role: "assistant", kind }])
      setPhase(-1)
      inputRef.current?.focus({ preventScroll: true })
    }, finish))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(question)
  }

  function clearConversation() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setMessages([])
    setPhase(-1)
    setQuestion("")
    inputRef.current?.focus({ preventScroll: true })
  }

  return <div className="assistant-page">
    <div className="page-title-row"><PageHeader title="Asisten shift" summary="Tanyakan kondisi shift, absensi, dan bacaan panas dalam satu percakapan." /><span className="assistant-simulation-pill"><span aria-hidden /> Simulasi AI</span></div>

    <div className="assistant-chat-layout">
      <section className="assistant-chat" aria-label="Percakapan asisten shift">
        <header className="assistant-chat-header"><span className="assistant-avatar" aria-hidden><SparkleIcon size={19} weight="fill" /></span><div><h2>Asisten TERMA</h2><p>Jawaban contoh dari skenario shift pagi</p></div><button type="button" onClick={clearConversation} disabled={!messages.length && phase < 0} aria-label="Mulai percakapan baru" title="Mulai percakapan baru"><ArrowClockwiseIcon size={19} /></button></header>
        <div className="assistant-chat-feed" ref={feedRef} role="log" aria-label="Riwayat percakapan" aria-live="polite">
          <div className="assistant-chat-welcome"><span className="assistant-avatar" aria-hidden><SparkleIcon size={19} weight="fill" /></span><div className="assistant-chat-bubble assistant-chat-bubble-welcome"><p>Halo! Saya bisa membantu merangkum prioritas shift, absensi, dan bacaan panas dari skenario ini. Apa yang ingin Anda cek?</p>{messages.length === 0 && <div className="assistant-chat-suggestions">{DEMO_PROMPTS.map(prompt => <button key={prompt.kind} type="button" onClick={() => submit(prompt.label)}>{prompt.label}<ArrowRightIcon size={15} aria-hidden /></button>)}</div>}</div></div>
          {messages.map(message => message.role === "user" ? <div className="assistant-chat-row assistant-chat-row-user" key={message.id}><div className="assistant-chat-bubble assistant-chat-bubble-user">{message.text}</div></div> : <div className="assistant-chat-row assistant-chat-row-assistant" key={message.id}><span className="assistant-avatar" aria-hidden><SparkleIcon size={17} weight="fill" /></span><div className="assistant-chat-bubble assistant-chat-bubble-answer"><h3>{DEMO_BRIEFINGS[message.kind].title}</h3><p>{DEMO_BRIEFINGS[message.kind].summary}</p>{DEMO_BRIEFINGS[message.kind].points.length > 0 && <ul>{DEMO_BRIEFINGS[message.kind].points.map(point => <li key={point.label}><strong>{point.label}</strong><span>{point.text}</span><small>{point.source}</small></li>)}</ul>}<span className="assistant-chat-answer-foot">Jawaban simulasi · periksa data aktual sebelum mengambil keputusan.</span></div></div>)}
          {phase >= 0 && <div className="assistant-chat-row assistant-chat-row-assistant" role="status"><span className="assistant-avatar assistant-avatar-thinking" aria-hidden><SparkleIcon size={17} weight="fill" /></span><div className="assistant-chat-bubble assistant-chat-bubble-thinking"><span className="assistant-typing-dots" aria-hidden><i /><i /><i /></span><span>{STEPS[phase]}…</span></div></div>}
        </div>
        <form className="assistant-chat-composer" onSubmit={onSubmit}><label className="sr-only" htmlFor="assistant-question">Tulis pertanyaan</label><Textarea ref={inputRef} id="assistant-question" value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(question) } }} maxLength={160} rows={2} placeholder="Tulis pertanyaan tentang shift…" disabled={phase >= 0} /><Button type="submit" disabled={!question.trim() || phase >= 0} aria-label="Kirim pertanyaan"><PaperPlaneRightIcon size={19} /></Button><p>Respons menggunakan contoh tetap. Belum terhubung ke model AI atau data operasional live.</p></form>
      </section>

      <aside className="assistant-context" aria-label="Data skenario simulasi"><div className="assistant-context-heading"><div><h2>Konteks percakapan</h2><p>Shift pagi · Zona Barat</p></div><span>Simulasi</span></div><div className="assistant-context-data"><div className="assistant-context-main"><span>WBGT · Zona Barat</span><strong>29,1 <small>°C</small></strong><p>09.20 · naik 1,2 °C dari 07.00</p></div>{DEMO_EVIDENCE.slice(1).map(item => <div className="assistant-context-row" key={item.label}><span>{item.label}</span><div><strong>{item.value}</strong><small>{item.detail}</small></div></div>)}</div><div className="assistant-context-foot"><strong>Mode simulasi aktif</strong><p>Cuplikan ini tetap sama selama percakapan. Belum membaca data dari sensor atau akun pekerja.</p></div></aside>
    </div>
  </div>
}

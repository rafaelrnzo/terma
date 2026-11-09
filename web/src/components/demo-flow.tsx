"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { CursorClickIcon } from "@phosphor-icons/react/dist/csr/CursorClick"
import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause"
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play"
import { StopIcon } from "@phosphor-icons/react/dist/csr/Stop"
import { XIcon } from "@phosphor-icons/react/dist/csr/X"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { hariIni } from "@/lib/config"
import type { Role } from "@/lib/types"

type Step =
  | { label: string; action: "navigate"; href: string; target: string }
  | { label: string; action: "click"; target: string; text?: string }
  | { label: string; action: "type"; target: string; value: string }
  | { label: string; action: "map"; target: string }
  | { label: string; action: "wait"; target: string; text?: string }

type Scenario = { id: string; title: string; description: string; steps: Step[] }
type Status = "idle" | "running" | "paused" | "done" | "error"

const scenarios: Scenario[] = [
  {
    id: "operasional", title: "Pantau operasional", description: "Beranda → absensi → perangkat → laporan",
    steps: [
      { label: "Membuka beranda operasional", action: "navigate", href: "/pengelola", target: ".page-heading" },
      { label: "Membuka daftar absensi", action: "navigate", href: "/monitoring?tab=absensi", target: "#attendance-search" },
      { label: "Mencari kehadiran Raya", action: "type", target: "#attendance-search", value: "Raya" },
      { label: "Melihat ekosistem perangkat", action: "navigate", href: "/perangkat", target: ".page-heading" },
      { label: "Membuka laporan shift", action: "navigate", href: "/laporan", target: ".page-heading" },
    ],
  },
  {
    id: "station", title: "Tempatkan Station", description: "Klik peta, isi lokasi, lalu simpan",
    steps: [
      { label: "Membuka peta prakiraan", action: "navigate", href: "/forecasting", target: ".zone-map" },
      { label: "Menaruh pin pada peta", action: "map", target: ".geographic-map.leaflet-container" },
      { label: "Mengisi ID Station", action: "type", target: "#placement-device", value: "TST-TUR" },
      { label: "Menamai lokasi", action: "type", target: "#placement-location", value: "Area Pantau Utara" },
      { label: "Menyimpan penempatan", action: "click", target: "section[aria-labelledby='station-placement-title'] form", text: "Simpan penempatan" },
      { label: "Memastikan Station tercatat", action: "wait", target: "table[aria-label='Station terpasang']", text: "TST-TUR" },
    ],
  },
  {
    id: "asisten", title: "Tanya asisten shift", description: "Ketik pertanyaan dan tunggu jawaban",
    steps: [
      { label: "Membuka asisten shift", action: "navigate", href: "/asisten", target: "#assistant-question" },
      { label: "Mengetik pertanyaan", action: "type", target: "#assistant-question", value: "Apa prioritas HSE pada shift pagi ini?" },
      { label: "Mengirim pertanyaan", action: "click", target: ".assistant-chat-composer button[type='submit']" },
      { label: "Menunggu jawaban asisten", action: "wait", target: ".assistant-chat-bubble-answer" },
    ],
  },
  {
    id: "absensi", title: "Absen sebagai Raya", description: "Pratinjau kamera → kondisi tubuh → tercatat",
    steps: [
      { label: "Membuka layar absen", action: "navigate", href: "/kiosk", target: ".kiosk-card" },
      { label: "Menyiapkan pratinjau kamera", action: "click", target: ".kiosk-entry-actions", text: "Pratinjau tanpa kamera" },
      { label: "Melanjutkan sebagai Raya", action: "click", target: ".kiosk-entry-actions", text: "Lanjut sebagai" },
      { label: "Menyetujui pencatatan kondisi", action: "click", target: ".kiosk-card", text: "Saya setuju & lanjut" },
      { label: "Mencatat kondisi tubuh", action: "click", target: ".kiosk-card", text: "Ya, merasa baik" },
      { label: "Memastikan absensi tercatat", action: "wait", target: ".kiosk-success" },
    ],
  },
]

function availableScenarios(role: Role, hasShift: boolean, canAttend: boolean) {
  if (role === "PEGAWAI") return canAttend ? scenarios.filter(item => item.id === "absensi") : []
  if (role === "ADMIN") return scenarios.filter(item => item.id !== "absensi" && (hasShift || item.id !== "operasional"))
  if (role === "HSE") return scenarios.filter(item => item.id === "asisten" || item.id === "station")
  if (role === "PETUGAS_DATA") return scenarios.filter(item => item.id === "station")
  return []
}

function findTarget(step: Step): HTMLElement | null {
  const root = document.querySelector<HTMLElement>(step.target)
  if (!root) return null
  if (step.action === "click" && step.text) {
    return [...root.querySelectorAll<HTMLElement>("button")].find(button => button.textContent?.includes(step.text!)) ?? null
  }
  return root
}

function setNativeValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

export function DemoFlow() {
  const router = useRouter()
  const { user, state, ready } = useApp()
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [index, setIndex] = useState(0)
  const [error, setError] = useState("")
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const control = useRef({ run: 0, paused: false })
  const highlighted = useRef<HTMLElement | null>(null)
  const active = scenarios.find(item => item.id === activeId)
  const shift = currentShift(state)
  const choices = user ? availableScenarios(user.role, !!shift, !!shift?.readiness && shift.status !== "CLOSED" && shift.tanggal === hariIni()) : []
  const ownCheckin = user?.role === "PEGAWAI" && shift?.readiness?.checkins.some(row => row.pekerjaKode === user.pekerjaKode)

  useEffect(() => () => { control.current.run += 1; highlighted.current?.classList.remove("flow-target") }, [])
  useEffect(() => { control.current.run += 1; control.current.paused = false; highlighted.current?.classList.remove("flow-target") }, [user?.id])

  function clearHighlight() {
    highlighted.current?.classList.remove("flow-target")
    highlighted.current = null
    setPointer(null)
  }

  function stop() {
    control.current.run += 1
    control.current.paused = false
    clearHighlight()
    setStatus("idle")
    setActiveId(null)
    setIndex(0)
    setError("")
  }

  function check(run: number) {
    if (control.current.run !== run) throw new Error("stopped")
  }

  async function sleep(ms: number, run: number) {
    let left = ms
    while (left > 0 || control.current.paused) {
      check(run)
      const slice = Math.min(left || 60, 60)
      await new Promise(resolve => window.setTimeout(resolve, slice))
      if (!control.current.paused) left -= slice
    }
    check(run)
  }

  async function targetFor(step: Step, run: number, timeout = 12000) {
    let elapsed = 0
    while (elapsed < timeout) {
      await sleep(100, run)
      if (step.action === "navigate" && `${window.location.pathname}${window.location.search}` !== step.href) { elapsed += 100; continue }
      const target = findTarget(step)
      if (target && !target.closest("[hidden]") && (step.action !== "wait" || !step.text || target.textContent?.includes(step.text))) return target
      elapsed += 100
    }
    throw new Error(`Bagian “${step.label}” belum tersedia. Periksa halaman, lalu jalankan ulang.`)
  }

  async function pointAt(target: HTMLElement, run: number) {
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center", inline: "nearest" })
    highlighted.current?.classList.remove("flow-target")
    target.classList.add("flow-target")
    highlighted.current = target
    await sleep(420, run)
    const rect = target.getBoundingClientRect()
    setPointer({ x: rect.left + rect.width * .6, y: rect.top + Math.min(rect.height * .5, 80) })
    await sleep(320, run)
  }

  async function execute(step: Step, run: number) {
    if (step.action === "navigate") {
      router.push(step.href)
      await targetFor(step, run)
      await sleep(350, run)
      return
    }
    const target = await targetFor(step, run)
    await pointAt(target, run)
    if (step.action === "type") {
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) throw new Error("Kolom untuk pengetikan tidak ditemukan.")
      target.focus({ preventScroll: true })
      setNativeValue(target, "")
      for (const char of step.value) {
        await sleep(55, run)
        setNativeValue(target, target.value + char)
      }
    } else if (step.action === "map") {
      const rect = target.getBoundingClientRect()
      target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: rect.left + rect.width * .61, clientY: rect.top + rect.height * .57 }))
      const lat = document.querySelector<HTMLInputElement>("#placement-lat")
      let elapsed = 0
      while (!lat?.value && elapsed < 3000) { await sleep(100, run); elapsed += 100 }
      if (!lat?.value) throw new Error("Pin belum terpasang. Coba buka peta kembali.")
    } else if (step.action === "click") {
      target.click()
    }
    await sleep(step.action === "wait" ? 1200 : 650, run)
    clearHighlight()
  }

  async function start(scenario: Scenario) {
    stop()
    const run = control.current.run
    setOpen(true)
    setActiveId(scenario.id)
    setStatus("running")
    try {
      for (let i = 0; i < scenario.steps.length; i += 1) {
        check(run)
        setIndex(i)
        const step = scenario.steps[i]
        if (scenario.id === "absensi" && i === 1 && ownCheckin) {
          await targetFor({ label: "Absensi Raya", action: "wait", target: ".kiosk-success" }, run)
          break
        }
        if (scenario.id === "absensi" && i === 3 && !findTarget(step) && findTarget(scenario.steps[4])) continue
        await execute(step, run)
        await sleep(850, run)
      }
      check(run)
      clearHighlight()
      setIndex(scenario.steps.length)
      setStatus("done")
    } catch (reason) {
      if (reason instanceof Error && reason.message === "stopped") return
      clearHighlight()
      setError(reason instanceof Error ? reason.message : "Alur terhenti. Coba jalankan lagi.")
      setStatus("error")
    }
  }

  if (!ready || !user || !choices.length) return null
  return <div className="flow-layer no-print">
    {pointer && status === "running" && <span className="flow-pointer" style={{ left: pointer.x, top: pointer.y }} aria-hidden><CursorClickIcon size={24} weight="fill" /></span>}
    {open ? <section className="flow-panel" aria-label="Pengendali alur interaktif">
      <header className="flow-header"><div><h2>Jalankan alur</h2><p>Pilih skenario untuk menggerakkan situs otomatis.</p></div><button type="button" aria-label="Tutup panel alur" onClick={() => { stop(); setOpen(false) }}><XIcon size={18} /></button></header>
      {active ? <div className="flow-running"><div className="flow-current"><span>{status === "done" ? <CheckCircleIcon size={18} weight="fill" /> : <CursorClickIcon size={18} />}</span><div><strong>{active.title}</strong><small>{status === "done" ? "Alur selesai" : status === "paused" ? "Dijeda" : status === "error" ? "Terhenti" : `${Math.min(index + 1, active.steps.length)} dari ${active.steps.length} langkah`}</small></div></div><div className="flow-progress" role="progressbar" aria-label="Kemajuan alur" aria-valuemin={0} aria-valuemax={active.steps.length} aria-valuenow={index}><span style={{ width: `${index / active.steps.length * 100}%` }} /></div><p className="flow-step" aria-live="polite">{status === "done" ? "Skenario berhasil dijalankan." : status === "error" ? error : active.steps[index]?.label}</p><div className="flow-actions">{status === "running" ? <Button size="sm" variant="outline" onClick={() => { control.current.paused = true; setStatus("paused") }}><PauseIcon />Jeda</Button> : status === "paused" ? <Button size="sm" onClick={() => { control.current.paused = false; setStatus("running") }}><PlayIcon />Lanjutkan</Button> : status === "error" ? <Button size="sm" onClick={() => void start(active)}><PlayIcon />Ulangi</Button> : null}<Button size="sm" variant="ghost" onClick={stop}><StopIcon />{status === "done" ? "Pilih alur lain" : "Hentikan"}</Button></div></div> : <div className="flow-choices">{choices.map(item => <button key={item.id} type="button" onClick={() => void start(item)}><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRightIcon size={17} /></button>)}</div>}
      <p className="flow-foot">Alur ini menggunakan fungsi halaman yang tersedia. Anda bisa menjeda kapan saja.</p>
    </section> : <Button className="flow-launch" onClick={() => setOpen(true)}><PlayIcon weight="fill" />Jalankan alur</Button>}
  </div>
}

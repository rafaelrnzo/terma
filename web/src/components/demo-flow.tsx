"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { CursorClickIcon } from "@phosphor-icons/react/dist/csr/CursorClick"
import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause"
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play"
import { StopIcon } from "@phosphor-icons/react/dist/csr/Stop"
import { XIcon } from "@phosphor-icons/react/dist/csr/X"
import { Button } from "@/components/ui/button"
import { BandDemoGuide } from "@/components/band-demo-guide"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { hariIni } from "@/lib/config"
import { prepareRayaIot } from "@/lib/iot-demo-client"

type Step =
  | { label: string; action: "navigate"; href: string; target: string }
  | { label: string; action: "click"; target: string; text?: string }
  | { label: string; action: "type"; target: string; value: string }
  | { label: string; action: "select"; target: string; value: string }
  | { label: string; action: "reset"; target: string; value: string }
  | { label: string; action: "map"; target: string }
  | { label: string; action: "iot"; target: string }
  | { label: string; action: "wait"; target: string; text?: string }

type Status = "idle" | "running" | "paused" | "done" | "error"

const FLOW: Step[] = [
  { label: "Membuka beranda admin", action: "navigate", href: "/pengelola", target: ".page-heading" },
  { label: "Membuka data Raya", action: "navigate", href: "/impor", target: ".page-heading" },
  { label: "Menautkan perangkat IoT ke Raya", action: "iot", target: ".page-heading" },
  { label: "Melihat hasil olahan perangkat Raya", action: "navigate", href: "/pemantauan/RAYA001", target: ".body-monitor" },
  { label: "Membuka absensi pekerja", action: "navigate", href: "/monitoring?tab=absensi", target: "table[aria-label='Absensi peserta shift']" },
  { label: "Menyiapkan ulang absensi Raya", action: "reset", target: "table[aria-label='Absensi peserta shift']", value: "RAYA001" },
  { label: "Membuka layar absen", action: "navigate", href: "/kiosk", target: "#kiosk-worker" },
  { label: "Memilih identitas Raya secara otomatis", action: "select", target: "#kiosk-worker", value: "RAYA001" },
  { label: "Menyiapkan pratinjau kamera", action: "click", target: ".kiosk-entry-actions", text: "Pratinjau tanpa kamera" },
  { label: "Mengonfirmasi identitas Raya", action: "click", target: ".kiosk-entry-actions", text: "Ya, saya Raya" },
  { label: "Menyetujui pencatatan kondisi", action: "click", target: ".kiosk-card", text: "Saya setuju & lanjut" },
  { label: "Mencatat kondisi tubuh", action: "click", target: ".kiosk-card", text: "Ya, merasa baik" },
  { label: "Memastikan absensi tercatat", action: "wait", target: ".kiosk-success" },
  { label: "Meninjau kehadiran di monitoring", action: "navigate", href: "/monitoring?tab=absensi", target: "#attendance-search" },
  { label: "Mencari catatan Raya", action: "type", target: "#attendance-search", value: "Raya" },
  { label: "Melihat ekosistem perangkat", action: "navigate", href: "/perangkat", target: ".page-heading" },
  { label: "Membuka peta prakiraan", action: "navigate", href: "/forecasting", target: ".zone-map" },
  { label: "Menaruh pin Station pada peta", action: "map", target: ".geographic-map.leaflet-container" },
  { label: "Mengisi ID Station", action: "type", target: "#placement-device", value: "TST-TUR" },
  { label: "Menamai lokasi", action: "type", target: "#placement-location", value: "Area Pantau Utara" },
  { label: "Menyimpan penempatan Station", action: "click", target: "section[aria-labelledby='station-placement-title'] form", text: "Simpan penempatan" },
  { label: "Memastikan Station tercatat", action: "wait", target: "table[aria-label='Station terpasang']", text: "TST-TUR" },
  { label: "Membuka asisten shift", action: "navigate", href: "/asisten", target: "#assistant-question" },
  { label: "Mengetik pertanyaan", action: "type", target: "#assistant-question", value: "Apa prioritas HSE pada shift pagi ini?" },
  { label: "Mengirim pertanyaan", action: "click", target: ".assistant-chat-composer button[type='submit']" },
  { label: "Menunggu jawaban asisten", action: "wait", target: ".assistant-chat-bubble-answer" },
  { label: "Membuka laporan shift", action: "navigate", href: "/laporan", target: ".page-heading" },
]

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
  const [status, setStatus] = useState<Status>("idle")
  const [index, setIndex] = useState(0)
  const [error, setError] = useState("")
  const [hint, setHint] = useState("")
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const control = useRef<{ run: number; paused: boolean; iot?: AbortController }>({ run: 0, paused: false })
  const highlighted = useRef<HTMLElement | null>(null)
  const shift = currentShift(state)

  useEffect(() => () => { control.current.run += 1; control.current.iot?.abort(); highlighted.current?.classList.remove("flow-target") }, [])
  useEffect(() => { control.current.run += 1; control.current.iot?.abort(); control.current.paused = false; highlighted.current?.classList.remove("flow-target") }, [user?.id])

  function clearHighlight() {
    highlighted.current?.classList.remove("flow-target")
    highlighted.current = null
    setPointer(null)
  }

  function stop() {
    control.current.run += 1
    control.current.iot?.abort()
    setHint("")
    control.current.paused = false
    clearHighlight()
    setStatus("idle")
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
    } else if (step.action === "select") {
      target.click()
      let option: HTMLElement | undefined
      let elapsed = 0
      while (!option && elapsed < 4000) {
        await sleep(100, run)
        option = [...document.querySelectorAll<HTMLElement>("[role='option']")].find(item => item.textContent?.includes(step.value) && !item.hasAttribute("data-disabled") && item.getAttribute("aria-disabled") !== "true")
        elapsed += 100
      }
      if (!option) throw new Error(`Pekerja ${step.value} tidak tersedia untuk absen.`)
      await pointAt(option, run)
      option.click()
    } else if (step.action === "reset") {
      const row = [...target.querySelectorAll<HTMLElement>("tbody tr")].find(item => item.textContent?.includes(step.value))
      if (!row) throw new Error(`Pekerja ${step.value} belum masuk dalam shift ini.`)
      const reset = [...row.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent?.includes("Reset absen datang"))
      if (reset) {
        await pointAt(reset, run)
        reset.click()
        let elapsed = 0
        while (row.isConnected && !row.textContent?.includes("Belum check-in") && elapsed < 5000) { await sleep(100, run); elapsed += 100 }
        if (row.isConnected && !row.textContent?.includes("Belum check-in")) throw new Error("Absensi Raya belum berhasil diatur ulang.")
      }
    } else if (step.action === "iot") {
      if (!user) throw new Error("Masuk sebagai Admin untuk menyiapkan IoT Raya.")
      const controller = new AbortController()
      control.current.iot = controller
      await prepareRayaIot(user, controller.signal, text => { check(run); setHint(text) }, () => sleep(0, run))
      check(run)
      setHint("")
      control.current.iot = undefined
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

  async function start() {
    stop()
    const run = control.current.run
    setOpen(true)
    setStatus("running")
    if (!shift?.readiness || shift.status === "CLOSED" || shift.tanggal !== hariIni() || !shift.workspace.pekerja.some(worker => worker.kode === "RAYA001")) {
      setError("Siapkan shift hari ini yang memuat Raya sebelum menjalankan presentasi.")
      setStatus("error")
      return
    }
    try {
      for (let i = 0; i < FLOW.length; i += 1) {
        check(run)
        setIndex(i)
        const step = FLOW[i]
        if (step.action === "click" && step.text === "Saya setuju & lanjut" && !findTarget(step) && findTarget({ label: "Kondisi", action: "click", target: ".kiosk-card", text: "Ya, merasa baik" })) continue
        await execute(step, run)
        await sleep(850, run)
      }
      check(run)
      clearHighlight()
      setIndex(FLOW.length)
      setStatus("done")
    } catch (reason) {
      if (reason instanceof Error && (reason.message === "stopped" || reason.name === "AbortError")) return
      clearHighlight()
      setError(reason instanceof Error ? reason.message : "Alur terhenti. Coba jalankan lagi.")
      setStatus("error")
    }
  }

  if (!ready || user?.role !== "ADMIN") return null
  return <div className="flow-layer no-print">
    {pointer && status === "running" && <span className="flow-pointer" style={{ left: pointer.x, top: pointer.y }} aria-hidden><CursorClickIcon size={24} weight="fill" /></span>}
    {open ? <section className="flow-panel" aria-label="Pengendali alur interaktif">
      <header className="flow-header"><div><h2>Presentasi TERMA</h2><p>Satu alur dari absensi sampai laporan.</p></div><button type="button" aria-label="Tutup pengendali presentasi" onClick={() => { stop(); setOpen(false) }}><XIcon size={18} /></button></header>
      <div className="flow-running"><div className="flow-current"><span>{status === "done" ? <CheckCircleIcon size={18} weight="fill" /> : <CursorClickIcon size={18} />}</span><div><strong>{status === "done" ? "Presentasi selesai" : status === "paused" ? "Presentasi dijeda" : status === "error" ? "Presentasi terhenti" : "Presentasi berjalan"}</strong><small>{status === "idle" ? "Siap diulang" : `${Math.min(index + 1, FLOW.length)} dari ${FLOW.length} langkah`}</small></div></div><div className="flow-progress" role="progressbar" aria-label="Kemajuan presentasi" aria-valuemin={0} aria-valuemax={FLOW.length} aria-valuenow={index}><span style={{ width: `${index / FLOW.length * 100}%` }} /></div><p className="flow-step" aria-live="polite">{status === "done" ? "Seluruh alur berhasil dijalankan." : status === "error" ? error : status === "idle" ? "Mulai lagi kapan saja." : hint || FLOW[index]?.label}</p><div className="flow-actions">{status === "running" ? <Button size="sm" variant="outline" onClick={() => { control.current.paused = true; setStatus("paused") }}><PauseIcon />Jeda</Button> : status === "paused" ? <Button size="sm" onClick={() => { control.current.paused = false; setStatus("running") }}><PlayIcon />Lanjutkan</Button> : <Button size="sm" onClick={() => void start()}><PlayIcon />{status === "done" ? "Ulangi presentasi" : "Mulai lagi"}</Button>}{(status === "running" || status === "paused") && <Button size="sm" variant="ghost" onClick={() => { stop(); setOpen(false) }}><StopIcon />Hentikan</Button>}</div></div>
      <details className="flow-band-after"><summary>Panduan Band fisik untuk Raya</summary><BandDemoGuide /></details>
      <p className="flow-foot">Alur menautkan perangkat, meminta tap kartu Raya, mengatur ulang absensi, dan menyimpan lokasi Station. Anda bisa menjeda kapan saja.</p>
    </section> : <Button className="flow-launch" onClick={() => void start()}><PlayIcon weight="fill" />Jalankan presentasi</Button>}
  </div>
}

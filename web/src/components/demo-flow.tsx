"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
import { CursorClickIcon } from "@phosphor-icons/react/dist/csr/CursorClick"
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause"
import { PlayIcon } from "@phosphor-icons/react/dist/csr/Play"
import { StopIcon } from "@phosphor-icons/react/dist/csr/Stop"
import { XIcon } from "@phosphor-icons/react/dist/csr/X"
import { Button } from "@/components/ui/button"
import { BandDemoGuide } from "@/components/band-demo-guide"
import { useApp } from "@/lib/store"
import { currentShift } from "@/lib/management-state"
import { hariIni } from "@/lib/config"

type Step =
  | { label: string; action: "navigate"; href: string; target: string }
  | { label: string; action: "click"; target: string; text?: string }
  | { label: string; action: "type"; target: string; value: string }
  | { label: string; action: "select"; target: string; value: string }
  | { label: string; action: "reset"; target: string; value: string }
  | { label: string; action: "map"; target: string }
  | { label: string; action: "wait"; target: string; text?: string }

type Status = "idle" | "running" | "paused" | "done" | "error"

type Chapter = { title: string; detail: string; href: string; target: string; actions?: Step[] }
const DWELL_MS = 5000
const FLOW: Chapter[] = [
  { title: "Dashboard admin", detail: "Gambaran lokasi dan pintu masuk ke seluruh modul.", href: "/pengelola", target: ".page-heading" },
  { title: "Ringkasan shift", detail: "Shift aktif menjadi konteks semua data berikutnya.", href: "/shift/:shift", target: ".page-heading" },
  { title: "Direktori pekerja", detail: "Identitas dan penugasan pekerja menjadi dasar absensi serta rencana.", href: "/impor", target: ".page-heading" },
  { title: "Pemeriksaan awal", detail: "Kondisi awal pekerja melengkapi profil untuk penilaian shift.", href: "/impor?tab=pemeriksaan", target: ".page-heading" },
  { title: "Profil Raya", detail: "Rencana dan riwayat kehadiran terhubung ke satu pekerja.", href: "/pekerja/RAYA001", target: ".page-heading" },
  { title: "Regu Raya", detail: "Penugasan Raya terhubung ke daftar rencana anggota regunya.", href: "/regu/:regu", target: ".page-heading" },
  { title: "Analisis Raya", detail: "Lihat dasar analisis paparan dari profil pekerja.", href: "/pekerja/RAYA001?tab=analisis", target: ".page-heading" },
  { title: "Adaptasi pekerja", detail: "Riwayat adaptasi menjadi masukan rencana kerja.", href: "/rencana?tab=adaptasi", target: ".page-heading" },
  { title: "Perencanaan shift", detail: "Rencana dan persetujuan menentukan instruksi pelaksanaan.", href: "/rencana", target: ".page-heading" },
  { title: "Instruksi regu", detail: "Tinjau pratinjau instruksi; pembagian aktif setelah shift diterbitkan.", href: "/instruksi", target: ".page-heading" },
  { title: "Pelaksanaan & verifikasi", detail: "Tindakan regu mengikuti instruksi pada shift yang diterbitkan.", href: "/tindakan", target: ".page-heading" },
  { title: "Persiapan absensi", detail: "Atur ulang kehadiran Raya agar alur check-in dapat diperlihatkan.", href: "/monitoring?tab=absensi", target: "table[aria-label='Absensi peserta shift']", actions: [
    { label: "Menyiapkan ulang absensi Raya", action: "reset", target: "table[aria-label='Absensi peserta shift']", value: "RAYA001" },
  ] },
  { title: "Absensi Raya", detail: "Identitas, pratinjau kamera, persetujuan, dan kondisi tubuh dicatat berurutan.", href: "/kiosk", target: "#kiosk-worker", actions: [
    { label: "Memilih identitas Raya", action: "select", target: "#kiosk-worker", value: "RAYA001" },
    { label: "Menyiapkan pratinjau kamera", action: "click", target: ".kiosk-entry-actions", text: "Pratinjau tanpa kamera" },
    { label: "Mengonfirmasi identitas Raya", action: "click", target: ".kiosk-entry-actions", text: "Ya, saya Raya" },
    { label: "Menyetujui pencatatan kondisi", action: "click", target: ".kiosk-card", text: "Saya setuju & lanjut" },
    { label: "Mencatat kondisi tubuh", action: "click", target: ".kiosk-card", text: "Ya, merasa baik" },
    { label: "Memastikan absensi tercatat", action: "wait", target: ".kiosk-success" },
  ] },
  { title: "Hasil absensi", detail: "Catatan Raya langsung terlihat pada monitoring shift.", href: "/monitoring?tab=absensi", target: "#attendance-search", actions: [
    { label: "Mencari catatan Raya", action: "type", target: "#attendance-search", value: "Raya" },
  ] },
  { title: "Pemantauan pekerja", detail: "Kehadiran dan kondisi Raya terkumpul pada profil pemantauan.", href: "/pemantauan/RAYA001", target: ".page-heading" },
  { title: "Pantau shift", detail: "Pantau kondisi lapangan dan tindak lanjut dari satu layar.", href: "/monitoring", target: ".page-heading" },
  { title: "Catatan minum", detail: "Data hidrasi melengkapi pemantauan paparan panas.", href: "/monitoring?tab=minum", target: ".page-heading" },
  { title: "Bacaan ISBB", detail: "Pembacaan suhu lingkungan terhubung ke pemantauan dan prakiraan.", href: "/monitoring?tab=isbb", target: ".page-heading" },
  { title: "Analitik shift", detail: "Lihat pola risiko dari data operasional yang sudah terkumpul.", href: "/monitoring?tab=analitik", target: ".page-heading" },
  { title: "Perangkat IoT", detail: "Station dan Band menjadi sumber data lapangan.", href: "/perangkat", target: ".page-heading" },
  { title: "Prakiraan & Station", detail: "Klik peta untuk menentukan koordinat lalu simpan penempatan Station.", href: "/forecasting", target: ".zone-map", actions: [
    { label: "Menaruh pin Station pada peta", action: "map", target: ".geographic-map.leaflet-container" },
    { label: "Mengisi ID Station", action: "type", target: "#placement-device", value: "TST-TUR" },
    { label: "Menamai lokasi", action: "type", target: "#placement-location", value: "Area Pantau Utara" },
    { label: "Menyimpan penempatan Station", action: "click", target: "section[aria-labelledby='station-placement-title'] form", text: "Simpan penempatan" },
    { label: "Memastikan Station tercatat", action: "wait", target: "table[aria-label='Station terpasang']", text: "TST-TUR" },
  ] },
  { title: "Asisten shift", detail: "Tanyakan prioritas HSE dan lihat respons yang terhubung ke data shift.", href: "/asisten", target: "#assistant-question", actions: [
    { label: "Mengetik pertanyaan", action: "type", target: "#assistant-question", value: "Apa prioritas HSE pada shift pagi ini?" },
    { label: "Mengirim pertanyaan", action: "click", target: ".assistant-chat-composer button[type='submit']" },
    { label: "Menunggu jawaban asisten", action: "wait", target: ".assistant-chat-bubble-answer" },
  ] },
  { title: "Kotak masuk Klinik", detail: "Tinjau kebutuhan tindak lanjut kondisi pekerja.", href: "/klinik", target: ".page-heading" },
  { title: "Laporan shift", detail: "Semua catatan lapangan bermuara pada laporan shift.", href: "/laporan", target: ".page-heading" },
  { title: "Rekap bulanan", detail: "Riwayat beberapa shift dirangkum untuk evaluasi berkala.", href: "/laporan/bulanan", target: ".page-heading" },
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
  const [stepLabel, setStepLabel] = useState("")
  const [remaining, setRemaining] = useState(5)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const control = useRef({ run: 0, paused: false })
  const currentIndex = useRef(0)
  const startedActions = useRef(new Set<number>())
  const highlighted = useRef<HTMLElement | null>(null)
  const shift = currentShift(state)

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
    setIndex(0)
    currentIndex.current = 0
    startedActions.current.clear()
    setRemaining(5)
    setStepLabel("")
    setError("")
  }

  function check(run: number) {
    if (control.current.run !== run) throw new Error("stopped")
  }

  async function sleep(ms: number, run: number, pauseable = true) {
    let left = ms
    while (left > 0 || (pauseable && control.current.paused)) {
      check(run)
      const slice = Math.min(left || 60, 60)
      await new Promise(resolve => window.setTimeout(resolve, slice))
      if (!pauseable || !control.current.paused) left -= slice
    }
    check(run)
  }

  async function targetFor(step: Step, run: number, timeout = 12000, pauseable = true) {
    let elapsed = 0
    while (elapsed < timeout) {
      await sleep(100, run, pauseable)
      if (step.action === "navigate" && `${window.location.pathname}${window.location.search}` !== step.href) { elapsed += 100; continue }
      const target = findTarget(step)
      if (target && !target.closest("[hidden]") && (step.action !== "wait" || !step.text || target.textContent?.includes(step.text))) return target
      elapsed += 100
    }
    throw new Error(`Bagian “${step.label}” belum tersedia. Periksa halaman, lalu jalankan ulang.`)
  }

  async function pointAt(target: HTMLElement, run: number, pauseable = true) {
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center", inline: "nearest" })
    highlighted.current?.classList.remove("flow-target")
    target.classList.add("flow-target")
    highlighted.current = target
    await sleep(420, run, pauseable)
    const rect = target.getBoundingClientRect()
    setPointer({ x: rect.left + rect.width * .6, y: rect.top + Math.min(rect.height * .5, 80) })
    await sleep(320, run, pauseable)
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
    setOpen(true)
    if (!shift?.readiness || shift.status === "CLOSED" || shift.tanggal !== hariIni() || !shift.workspace.pekerja.some(worker => worker.kode === "RAYA001")) {
      setError("Siapkan shift hari ini yang memuat Raya sebelum menjalankan presentasi.")
      setStatus("error")
      return
    }
    goTo(0)
  }

  function goTo(next: number) {
    if (next < 0 || next >= FLOW.length) return
    control.current.run += 1
    const run = control.current.run
    currentIndex.current = next
    setIndex(next)
    setRemaining(5)
    setStepLabel("")
    setError("")
    clearHighlight()
    if (!control.current.paused) setStatus("running")
    void visit(next, run)
  }

  async function visit(page: number, run: number) {
    const chapter = FLOW[page]
    try {
      const href = chapter.href.replace(":shift", shift?.id ?? "").replace(":regu", shift?.workspace.pekerja.find(worker => worker.kode === "RAYA001")?.reguKode.toLowerCase() ?? "")
      const entry: Step = { label: chapter.title, action: "navigate", href, target: chapter.target }
      setStepLabel(`Membuka ${chapter.title}`)
      router.push(href)
      const target = await targetFor(entry, run, 12000, false)
      await pointAt(target, run, false)
      clearHighlight()
      if (!startedActions.current.has(page) && chapter.actions?.length) {
        await sleep(0, run)
        startedActions.current.add(page)
        for (const action of chapter.actions) {
          check(run)
          setStepLabel(action.label)
          // The kiosk can skip consent when consent has already been recorded.
          if (action.label === "Menyetujui pencatatan kondisi" && !findTarget(action) && findTarget(chapter.actions[4])) continue
          await execute(action, run)
        }
      }
      check(run)
      setStepLabel("")
      for (let left = DWELL_MS; left > 0; left -= 100) {
        setRemaining(Math.ceil(left / 1000))
        await sleep(100, run)
      }
      if (page === FLOW.length - 1) {
        clearHighlight()
        setRemaining(0)
        setStatus("done")
      } else goTo(page + 1)
    } catch (reason) {
      if (reason instanceof Error && reason.message === "stopped") return
      clearHighlight()
      setError(reason instanceof Error ? reason.message : "Alur terhenti. Coba jalankan lagi.")
      setStatus("error")
    }
  }

  if (!ready || user?.role !== "ADMIN") return null
  return <div className="flow-layer no-print">
    {pointer && status === "running" && <span className="flow-pointer" style={{ left: pointer.x, top: pointer.y }} aria-hidden><CursorClickIcon size={24} weight="fill" /></span>}
    {open ? <section className="flow-panel" aria-label="Pengendali alur interaktif">
      <header className="flow-header"><div><h2>Presentasi TERMA</h2><p>Satu alur dari data pekerja sampai laporan.</p></div><button type="button" aria-label="Tutup pengendali presentasi" onClick={() => { stop(); setOpen(false) }}><XIcon size={18} /></button></header>
      <div className="flow-running">
        <div className="flow-current"><span>{status === "done" ? <CheckCircleIcon size={18} weight="fill" /> : <CursorClickIcon size={18} />}</span><div><strong>{status === "done" ? "Presentasi selesai" : status === "paused" ? "Presentasi dijeda" : status === "error" ? "Presentasi terhenti" : "Presentasi berjalan"}</strong><small>{status === "idle" ? "Siap diulang" : `Halaman ${index + 1} dari ${FLOW.length}`}</small></div></div>
        <div className="flow-progress" role="progressbar" aria-label="Kemajuan presentasi" aria-valuemin={0} aria-valuemax={FLOW.length} aria-valuenow={index + (status === "done" ? 1 : 0)}><span style={{ width: `${(index + (status === "done" ? 1 : 0)) / FLOW.length * 100}%` }} /></div>
        <div className="flow-chapter"><strong>{FLOW[index].title}</strong><p>{FLOW[index].detail}</p></div>
        <p className="flow-step" aria-live="polite">{status === "done" ? "Seluruh halaman sudah ditampilkan." : status === "error" ? error : status === "idle" ? "Mulai lagi kapan saja." : stepLabel || (status === "paused" ? "Waktu berhenti sampai Anda melanjutkan." : `Halaman berikutnya dalam ${remaining} detik.`)}</p>
        <p className="flow-next">{index < FLOW.length - 1 ? `Berikutnya: ${FLOW[index + 1].title}` : "Akhir alur"}</p>
        <div className="flow-actions">
          {(status === "running" || status === "paused" || status === "done" || status === "error") && <><Button size="sm" variant="outline" disabled={index === 0} onClick={() => goTo(currentIndex.current - 1)}><ArrowLeftIcon />Sebelumnya</Button><Button size="sm" variant="outline" disabled={index === FLOW.length - 1} onClick={() => goTo(currentIndex.current + 1)}>Selanjutnya<ArrowRightIcon /></Button></>}
          {status === "running" ? <Button size="sm" variant="outline" onClick={() => { control.current.paused = true; setStatus("paused") }}><PauseIcon />Jeda</Button> : status === "paused" ? <Button size="sm" onClick={() => { control.current.paused = false; setStatus("running") }}><PlayIcon />Lanjutkan</Button> : <Button size="sm" onClick={() => void start()}><PlayIcon />{status === "done" ? "Ulangi presentasi" : "Mulai lagi"}</Button>}
          {(status === "running" || status === "paused") && <Button size="sm" variant="ghost" onClick={() => { stop(); setOpen(false) }}><StopIcon />Hentikan</Button>}
        </div>
      </div>
      {status === "done" && <details className="flow-band-after"><summary>Panduan Band fisik untuk Raya</summary><BandDemoGuide /></details>}
      <p className="flow-foot">Saat berjalan otomatis, tiap halaman bertahan 5 detik setelah interaksi selesai. Absensi dan penempatan Station hanya dijalankan sekali dalam satu presentasi.</p>
    </section> : <Button className="flow-launch" onClick={() => void start()}><PlayIcon weight="fill" />Jalankan presentasi</Button>}
  </div>
}

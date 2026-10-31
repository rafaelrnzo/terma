"use client"

import { useEffect, useRef, useState } from "react"
import { QuestionIcon as CircleHelp } from "@phosphor-icons/react"
import type { Driver } from "driver.js"
import "driver.js/dist/driver.css"
import { Button } from "@/components/ui/button"

export function DashboardTour() {
  const tour = useRef<Driver | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const mounted = useRef(false)
  const pending = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; tour.current?.destroy() }
  }, [])
  async function start() {
    if (pending.current || tour.current?.isActive()) return
    pending.current = true
    setLoading(true)
    setError(false)
    try {
      const { driver } = await import("driver.js")
      if (!mounted.current) return
      const visible = (desktop: string, mobile: string) => window.matchMedia(desktop === "role" ? "(min-width: 640px)" : "(min-width: 1024px)").matches ? `[data-tour="${desktop}"]` : `[data-tour="${mobile}"]`
      tour.current = driver({
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: 200, smoothScroll: false, allowClose: true, disableActiveInteraction: true,
        showProgress: true, progressText: "{{current}} dari {{total}}", nextBtnText: "Lanjut", prevBtnText: "Kembali", doneBtnText: "Selesai", closeBtnLabel: "Lewati panduan", popoverClass: "terma-tour", stageRadius: 12,
        steps: [
          { element: visible("role", "role-mobile"), popover: { title: "Pilih peran simulasi", description: "Coba sebagai HSE, mandor, atau petugas data. Pekerjaan dan lingkup pekerja mengikuti peran yang dipilih; ini bukan login." } },
          { element: "#tanggal", popover: { title: "Periksa tanggal kerja", description: "Bacaan, rencana, dan laporan mengikuti tanggal ini. Jika kosong, gunakan Kembali ke tanggal demo. Hanya peran yang berwenang dapat mengganti tanggal." } },
          { element: visible("navigation", "navigation-mobile"), popover: { title: "Temukan langkah kerja", description: "Dashboard untuk orientasi, Data lapangan untuk pekerja dan pengukuran, lalu Rencana kerja, Tindak lanjut, dan Laporan." } },
          { element: "[data-tour=zones]", popover: { title: "Pilih zona kerja", description: "Pilih zona untuk melihat profil WBGT selama shift. Grafik memakai bacaan replay pada tanggal terpilih." } },
          { element: "[data-tour=reading]", popover: { title: "Baca interval dan sumber", description: "Baca nilai puncak dan kualitas sumber. Zona tanpa pengukuran tetap kosong. Batas kerja mengikuti rencana HSE, bukan warna grafik." } },
          { element: "[data-tour=priority]", popover: { title: "Lanjutkan pekerjaan Anda", description: "Tombol ini membuka langkah berikutnya sesuai peran. Tutup panduan untuk mulai; Anda dapat mengulangnya kapan saja dari Panduan dashboard." } },
        ],
        onPopoverRender: (popover) => { popover.closeButton.textContent = "Lewati"; popover.closeButton.setAttribute("aria-label", "Lewati panduan") },
        onDestroyed: () => { queueMicrotask(() => { if (mounted.current) trigger.current?.focus() }) },
      })
      tour.current.drive()
    } catch { if (mounted.current) setError(true) }
    finally { pending.current = false; if (mounted.current) setLoading(false) }
  }
  return <div className="no-print"><Button ref={trigger} variant="outline" onClick={start} aria-busy={loading} disabled={loading}><CircleHelp aria-hidden />{loading ? "Memuat panduan…" : "Panduan dashboard"}</Button>{error && <p role="alert" className="mt-2 max-w-xs text-xs text-destructive">Panduan gagal dimuat. Klik tombol untuk mencoba lagi.</p>}</div>
}

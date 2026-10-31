"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { QuestionIcon } from "@phosphor-icons/react"
import type { Driver } from "driver.js"
import "driver.js/dist/driver.css"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { guideItinerary } from "@/lib/shift-journey"
import { pageGuide } from "@/lib/guide-content"

type Mode = "page" | "journey"
interface GuideSession { mode: Mode; routes: string[]; index: number; userId: string; date: string }
const GuideContext = createContext<{ start: (mode: Mode) => void; loading: boolean; error: string } | null>(null)

export function WorkflowGuideProvider({ children }: { children: ReactNode }) {
  const { user, state, ready } = useApp()
  const path = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<GuideSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const active = useRef<Driver | null>(null)
  const requestedRoute = useRef<string | null>(null)
  function start(mode: Mode) {
    if (!user || !ready || loading) return
    active.current?.destroy()
    setError("")
    const routes = mode === "page" ? [path] : guideItinerary(state, user)
    requestedRoute.current = routes[0]
    setSession({ mode, routes, index: 0, userId: user.id, date: state.tanggal })
    if (path !== routes[0]) router.push(routes[0])
  }
  useEffect(() => {
    if (!session || !user || !ready) return
    if (session.userId !== user.id || session.date !== state.tanggal) { setSession(null); return }
    const route = session.routes[session.index]
    if (requestedRoute.current && requestedRoute.current !== route) return
    if (path !== route) { if (!requestedRoute.current) setSession(null); return }
    requestedRoute.current = null
    const guideUser = user
    const guideSession = session
    const changePage = (index: number) => {
      requestedRoute.current = guideSession.routes[index]
      setSession({ ...guideSession, index })
      router.push(guideSession.routes[index])
    }
    let disposed = false
    let tour: Driver | null = null
    setLoading(true)
    async function show() {
      try {
        const { driver } = await import("driver.js")
        if (disposed) return
        const points = pageGuide(route, guideUser.role).filter(point => {
          const target = document.querySelector(point.selector)
          return target instanceof HTMLElement && target.getBoundingClientRect().height > 0
        })
        if (!points.length) throw new Error("Tidak ada langkah panduan yang dapat ditampilkan pada halaman ini.")
        const hasNextRoute = guideSession.mode === "journey" && guideSession.index + 1 < guideSession.routes.length
        tour = driver({
          animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          duration: 180, smoothScroll: false, allowClose: true, disableActiveInteraction: true,
          showProgress: true, progressText: `{{current}} / {{total}}${guideSession.mode === "journey" ? ` · halaman ${guideSession.index + 1}/${guideSession.routes.length}` : ""}`,
          nextBtnText: "Lanjut", prevBtnText: "Kembali", doneBtnText: hasNextRoute ? "Halaman berikutnya" : "Selesai",
          closeBtnLabel: "Tutup panduan", popoverClass: "terma-tour", stageRadius: 10,
          steps: points.map(point => ({ element: point.selector, popover: { title: point.title, description: point.description } })),
          onNextClick: () => {
            if (!tour) return
            if (tour.hasNextStep()) tour.moveNext()
            else if (hasNextRoute) changePage(guideSession.index + 1)
            else setSession(null)
          },
          onPrevClick: () => {
            if (!tour) return
            if (tour.hasPreviousStep()) tour.movePrevious()
            else if (guideSession.index > 0) changePage(guideSession.index - 1)
          },
          onPopoverRender: popover => {
            popover.closeButton.textContent = "Tutup"
            popover.closeButton.setAttribute("aria-label", "Tutup panduan")
            if (guideSession.index > 0) {
              popover.previousButton.disabled = false
              popover.previousButton.classList.remove("driver-popover-btn-disabled")
            }
          },
          onDestroyed: () => { if (!disposed) { setSession(null); document.querySelector<HTMLElement>('[data-guide="launch"]')?.focus() } },
        })
        active.current = tour
        tour.drive()
      } catch (cause) {
        if (!disposed) { setError(cause instanceof Error ? cause.message : "Panduan gagal dimuat. Coba lagi."); setSession(null) }
      } finally { if (!disposed) setLoading(false) }
    }
    void show()
    return () => {
      disposed = true
      if (tour) { tour.setConfig({ ...tour.getConfig(), animate: false }); tour.destroy() }
      active.current = null
      setLoading(false)
    }
  }, [session, path, ready, router, user, state.tanggal])
  return <GuideContext.Provider value={{ start, loading, error }}>{children}</GuideContext.Provider>
}

export function GuideButton({ mode = "page", compact = false, label }: { mode?: Mode; compact?: boolean; label?: string }) {
  const guide = useContext(GuideContext)
  if (!guide) throw new Error("GuideButton must be inside WorkflowGuideProvider")
  return <div className="no-print"><Button data-guide="launch" variant="outline" size={compact ? "icon" : "default"} onClick={() => guide.start(mode)} disabled={guide.loading} aria-busy={guide.loading} aria-label={compact ? "Panduan interaktif halaman ini" : undefined}><QuestionIcon size={16} />{!compact && (guide.loading ? "Memuat panduan…" : label ?? (mode === "page" ? "Panduan halaman ini" : "Panduan alur shift"))}</Button>{guide.error && !compact && <p role="alert" className="mt-2 max-w-sm text-xs text-destructive">{guide.error}</p>}</div>
}

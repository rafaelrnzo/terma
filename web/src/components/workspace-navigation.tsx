"use client"

import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef } from "react"
import { SquaresFourIcon } from "@phosphor-icons/react/dist/csr/SquaresFour"
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/csr/IdentificationCard"
import { FirstAidKitIcon } from "@phosphor-icons/react/dist/csr/FirstAidKit"
import { PersonSimpleWalkIcon } from "@phosphor-icons/react/dist/csr/PersonSimpleWalk"
import { ClipboardTextIcon } from "@phosphor-icons/react/dist/csr/ClipboardText"
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt"
import { ListChecksIcon } from "@phosphor-icons/react/dist/csr/ListChecks"
import { CloudSunIcon } from "@phosphor-icons/react/dist/csr/CloudSun"
import { PulseIcon } from "@phosphor-icons/react/dist/csr/Pulse"
import { ThermometerIcon } from "@phosphor-icons/react/dist/csr/Thermometer"
import { CpuIcon } from "@phosphor-icons/react/dist/csr/Cpu"
import { FingerprintIcon } from "@phosphor-icons/react/dist/csr/Fingerprint"
import { FileTextIcon } from "@phosphor-icons/react/dist/csr/FileText"
import { ChartBarIcon } from "@phosphor-icons/react/dist/csr/ChartBar"
import { LightbulbIcon } from "@phosphor-icons/react/dist/csr/Lightbulb"
import { ShieldPlusIcon } from "@phosphor-icons/react/dist/csr/ShieldPlus"
import { StethoscopeIcon } from "@phosphor-icons/react/dist/csr/Stethoscope"
import { navigationFor, navigationGroup, roleHomePath, ROLE_WORKSPACE, pageAllowedFor } from "@/lib/navigation"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

const icons: Record<string, typeof SquaresFourIcon> = {
  "/ringkasan": SquaresFourIcon, "/hse": SquaresFourIcon, "/admin": SquaresFourIcon, "/mandor": SquaresFourIcon, "/klinik": StethoscopeIcon,
  "/impor": IdentificationCardIcon, "/kesehatan-awal": FirstAidKitIcon, "/paparan": PersonSimpleWalkIcon,
  "/rencana": ClipboardTextIcon, "/instruksi": PaperPlaneTiltIcon, "/tindakan": ListChecksIcon,
  "/forecasting": CloudSunIcon, "/monitoring": PulseIcon, "/pengukuran": ThermometerIcon,
  "/perangkat": CpuIcon, "/absensi": FingerprintIcon,
  "/laporan/bulanan": ShieldPlusIcon, "/laporan": FileTextIcon, "/analitik": ChartBarIcon, "/insight": LightbulbIcon, "/kesehatan": ShieldPlusIcon,
}

export function Navigation({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const path = usePathname()
  const { user } = useApp()
  const group = navigationGroup(path)
  const nav = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const root = nav.current
    const thumb = indicator.current
    if (!root || !thumb) return
    const place = () => {
      const item = root.querySelector<HTMLElement>("[data-active=true]")
      if (!item) { thumb.hidden = true; return }
      thumb.hidden = false
      thumb.style.transform = `translateY(${item.getBoundingClientRect().top - root.getBoundingClientRect().top}px)`
      thumb.style.height = `${item.offsetHeight}px`
    }
    place()
    const frame = requestAnimationFrame(() => thumb.setAttribute("data-placed", "true"))
    const observer = new ResizeObserver(place)
    observer.observe(root)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [path, user?.id])
  return <nav ref={nav} aria-label="Modul aplikasi" className={cn("workspace-navigation", mobile && "p-4")}>
    <span ref={indicator} className="nav-indicator" aria-hidden />
    {navigationFor(user).map((item) => {
      const routes = item.routes.filter(route => !user || pageAllowedFor(user, route.href))
      const home = item.href === "/ringkasan"
      const links = home ? [{ href: user ? roleHomePath(user) : item.href, label: user ? ROLE_WORKSPACE[user.role].nav : item.label }] : routes.filter(route=>!("hiddenInNav" in route && route.hiddenInNav) || routes.length===1)
      return <div key={item.href} className="nav-group">
        {links.length > 1 && <p className="nav-group-heading">{item.label}</p>}
        {links.map(route => {
          const Icon = icons[route.href] ?? SquaresFourIcon
          const active = path === route.href || (group === item && (home || !links.some(destination => destination.href === path)) && route === links[0])
          return <Link key={route.href} href={route.href} onClick={onNavigate} data-active={active} aria-current={active ? "page" : undefined} className={cn("nav-item gap-3", active && "nav-item-active")}><span className="selectable-icon"><Icon className="icon-outline size-4" aria-hidden /><Icon className="icon-fill size-4" weight="fill" aria-hidden /></span>{route.label}<NavigationFeedback /></Link>
        })}
      </div>
    })}
  </nav>
}

function NavigationFeedback() {
  const { pending } = useLinkStatus()
  return <><span className="nav-request-feedback" data-pending={pending} aria-hidden /><span className="sr-only" role="status">{pending ? "Membuka halaman" : ""}</span></>
}

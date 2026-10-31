"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef } from "react"
import { SquaresFourIcon as LayoutDashboard, ClipboardTextIcon as ClipboardList, CalendarCheckIcon as CalendarCheck, ListChecksIcon as ListChecks, FileTextIcon as FileText } from "@phosphor-icons/react"
import { NAV_GROUPS, navigationGroup } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const icons = [LayoutDashboard, ClipboardList, CalendarCheck, ListChecks, FileText]

export function Navigation({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const path = usePathname()
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
      thumb.style.transform = `translateY(${item.offsetTop}px)`
      thumb.style.height = `${item.offsetHeight}px`
    }
    place()
    const frame = requestAnimationFrame(() => thumb.setAttribute("data-placed", "true"))
    const observer = new ResizeObserver(place)
    observer.observe(root)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [path])
  return <nav ref={nav} aria-label="Alur kerja" className={cn("workspace-navigation", mobile && "p-4")}>
    <span ref={indicator} className="nav-indicator" aria-hidden />
    {NAV_GROUPS.map((item, index) => {
      const active = group === item
      const Icon = icons[index]
      return <div key={item.href} className="nav-group">
        <Link href={item.href} onClick={onNavigate} data-active={active} aria-current={path === item.href ? "page" : undefined} className={cn("nav-item gap-3", active && "nav-item-active")}>
          <span className="selectable-icon"><Icon className="icon-outline size-4" aria-hidden /><Icon className="icon-fill size-4" weight="fill" aria-hidden /></span>{item.label}
        </Link>
        {(mobile || active) && item.routes.length > 1 && <div className="sidebar-subroutes">{item.routes.map(route => <Link key={route.href} href={route.href} onClick={onNavigate} className="nav-item" aria-current={path === route.href ? "page" : undefined}>{route.label}</Link>)}</div>}
      </div>
    })}
  </nav>
}

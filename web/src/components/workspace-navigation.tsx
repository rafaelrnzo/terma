"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef } from "react"
import { SquaresFourIcon, UsersThreeIcon, CloudSunIcon, BroadcastIcon, FileTextIcon } from "@phosphor-icons/react"
import { navigationFor, navigationGroup, roleHomePath, ROLE_WORKSPACE } from "@/lib/navigation"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

const icons: Record<string, typeof SquaresFourIcon> = { "/ringkasan": SquaresFourIcon, "/impor": UsersThreeIcon, "/forecasting": CloudSunIcon, "/monitoring": BroadcastIcon, "/laporan": FileTextIcon }

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
  return <nav ref={nav} aria-label="Alur kerja" className={cn("workspace-navigation", mobile && "p-4")}>
    <span ref={indicator} className="nav-indicator" aria-hidden />
    {navigationFor(user).map((item) => {
      const active = group === item
      const Icon = icons[item.href]
      const href = item.href === "/ringkasan" && user ? roleHomePath(user) : item.href
      return <div key={item.href} className="nav-group">
        <Link href={href} onClick={onNavigate} data-active={active} aria-current={path === href ? "page" : undefined} className={cn("nav-item gap-3", active && "nav-item-active")}>
          <span className="selectable-icon"><Icon className="icon-outline size-4" aria-hidden /><Icon className="icon-fill size-4" weight="fill" aria-hidden /></span>{item.href === "/ringkasan" && user ? ROLE_WORKSPACE[user.role].nav : item.label}
        </Link>
        {(mobile || active) && item.routes.length > 1 && <div className="sidebar-subroutes">{item.routes.map(route => <Link key={route.href} href={route.href} onClick={onNavigate} className="nav-item" aria-current={path === route.href ? "page" : undefined}>{route.label}</Link>)}</div>}
      </div>
    })}
  </nav>
}

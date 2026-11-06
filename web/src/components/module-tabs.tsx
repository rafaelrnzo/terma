"use client"

import Link from "next/link"
import { useLayoutEffect, useRef } from "react"

export interface ModuleTab { key: string; label: string; href: string }

export function ModuleTabs({ tabs, active, label }: { tabs: ModuleTab[]; active: string; label: string }) {
  const root = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const nav = root.current, thumb = indicator.current
    if (!nav || !thumb) return
    const place = () => {
      const link = nav.querySelector<HTMLElement>('[aria-current="page"]')
      if (!link) return
      thumb.style.transform = `translateX(${link.offsetLeft}px)`
      thumb.style.width = `${link.offsetWidth}px`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [active, tabs])
  return <nav ref={root} className="module-tabs no-print" aria-label={label}>{tabs.map(tab => <Link key={tab.key} href={tab.href} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const destination = new URL(tab.href, window.location.href)
    if (destination.pathname === window.location.pathname && destination.origin === window.location.origin) {
      event.preventDefault()
      window.history.pushState(null, "", destination.pathname + destination.search + destination.hash)
    }
  }} aria-current={active === tab.key ? "page" : undefined}>{tab.label}</Link>)}<span ref={indicator} className="module-tab-indicator" aria-hidden /></nav>
}

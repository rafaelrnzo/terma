"use client"

import { useEffect, useRef } from "react"

/** Progressive enhancement only: the server-rendered page never waits for animation. */
export function LandingMotion() {
  const progress = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".landing-nav a"))
    const sections = links.map(link => document.querySelector<HTMLElement>(link.hash))
    let frame = 0
    const update = () => {
      frame = 0
      const distance = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) progress.current.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`
      let selected = -1
      sections.forEach((section, index) => { if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.4) selected = index })
      links.forEach((link, index) => {
        if (index === selected) link.setAttribute("aria-current", "location")
        else link.removeAttribute("aria-current")
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    update()

    let entrance: Animation | undefined
    const example = document.querySelector<HTMLElement>(".landing-plan-example")
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !example) return
      observer.disconnect()
      if (!preference.matches && typeof example.animate === "function") {
        entrance = example.animate([
          { transform: "translateY(14px)", opacity: 0.85, clipPath: "inset(0 0 5% 0 round 12px)" },
          { transform: "translateY(0)", opacity: 1, clipPath: "inset(0 0 0 0 round 12px)" },
        ], { duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)" })
      }
    }, { threshold: 0.25 })
    if (example) observer.observe(example)
    const stopEntrance = () => { if (preference.matches || document.hidden) entrance?.cancel() }
    preference.addEventListener("change", stopEntrance)
    document.addEventListener("visibilitychange", stopEntrance)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      links.forEach(link => link.removeAttribute("aria-current"))
      observer.disconnect()
      entrance?.cancel()
      preference.removeEventListener("change", stopEntrance)
      document.removeEventListener("visibilitychange", stopEntrance)
    }
  }, [])
  return <div ref={progress} className="landing-reading-progress" aria-hidden />
}

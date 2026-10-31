"use client"

import { useEffect, useRef, useState } from "react"
import { telemetryFrame, type DeviceSelection } from "@/lib/device-telemetry"
import { DEVICE_FOCUS } from "./generated-view"

export function useInstrumentLoop(zone: string, selection: DeviceSelection) {
  const root = useRef<HTMLElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const running = useRef(true)
  const selectionRef = useRef(selection)
  const zoneRef = useRef(zone)
  const elapsed = useRef(0)
  const taps = useRef(0)
  const requestPaint = useRef<() => void>(() => {})
  const [frame, setFrame] = useState(() => telemetryFrame(0, zone))
  const [paused, setPaused] = useState(false)
  const [updated, setUpdated] = useState("")
  useEffect(() => { selectionRef.current = selection; requestPaint.current() }, [selection])
  useEffect(() => { zoneRef.current = zone; setFrame(telemetryFrame(elapsed.current, zone, 12, taps.current)) }, [zone])
  useEffect(() => {
    const node = root.current
    const drawing = svg.current
    if (!node || !drawing) return
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    let visible = true, previous = 0, lastRead = -5, raf = 0, lastVisits = 0, flash = 0
    const box: number[] = [...DEVICE_FOCUS.all]
    const bandLed = node.querySelector<SVGGElement>('[data-part="band.led"]')
    const packetLeds = node.querySelectorAll<SVGGElement>('[data-part="station.led"],[data-part^="gateway.led-"]')
    const waterLed = node.querySelector<SVGGElement>('[data-part="water.reader-led"]')
    const lamps = node.querySelectorAll<SVGCircleElement>('[data-signal]')
    function paint(time: number) {
      if (!visible || document.hidden) return
      const dt = previous ? Math.min((time - previous) / 1000, .1) : 0
      previous = time
      const active = visible && !document.hidden && running.current
      node!.dataset.running = String(active && !motion.matches)
      if (active && !motion.matches) elapsed.current += dt
      const target = DEVICE_FOCUS[selectionRef.current]
      const ease = motion.matches ? 1 : 1 - Math.exp(-dt * 8)
      for (let i = 0; i < 4; i++) box[i] += (target[i] - box[i]) * ease
      drawing!.setAttribute("viewBox", box.map(value => value.toFixed(2)).join(" "))
      const sample = telemetryFrame(elapsed.current, zoneRef.current, 12, taps.current)
      if (active && elapsed.current - lastRead >= 5) {
        setFrame(sample); setUpdated(new Date().toLocaleTimeString("id-ID")); lastRead = elapsed.current
      }
      const pulse = motion.matches || !active ? .8 : .45 + .55 * Math.pow(Math.max(0, Math.sin(elapsed.current * sample.heartRate / 60 * Math.PI * 2)), 6)
      if (sample.visits !== lastVisits) { flash = 1; lastVisits = sample.visits }
      else flash *= Math.exp(-dt * 5)
      waterLed?.setAttribute("opacity", String(motion.matches ? .8 : .4 + flash * .6))
      bandLed?.setAttribute("opacity", String(pulse))
      const packetPhase = (elapsed.current % 5) / 5
      packetLeds.forEach(lamp => lamp.setAttribute("opacity", String(motion.matches || !active ? .8 : .45 + .55 * Math.exp(-packetPhase * 15))))
      lamps.forEach((lamp, index) => {
        const phase = motion.matches || !active ? .25 : (elapsed.current / 5 + index / 4) % 1
        lamp.setAttribute("r", String(3 + phase * 14))
        lamp.setAttribute("opacity", String(motion.matches || !active ? .15 : (1 - phase) * .42))
      })
      const moving = box.some((value, index) => Math.abs(value - target[index]) > .05)
      if ((active && !motion.matches) || moving) raf = requestAnimationFrame(paint)
    }
    const activate = () => { cancelAnimationFrame(raf); previous = 0; if (visible && !document.hidden) raf = requestAnimationFrame(paint) }
    requestPaint.current = activate
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; activate() }, { threshold: .05 })
    observer.observe(node)
    document.addEventListener("visibilitychange", activate)
    motion.addEventListener("change", activate)
    activate()
    return () => { cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener("visibilitychange", activate); motion.removeEventListener("change", activate); requestPaint.current = () => {} }
  }, [])
  function tap() {
    taps.current++
    setFrame(telemetryFrame(elapsed.current, zoneRef.current, 12, taps.current))
    setUpdated(new Date().toLocaleTimeString("id-ID"))
    requestPaint.current()
  }
  function toggle() { running.current = !running.current; setPaused(!running.current); requestPaint.current() }
  return { root, svg, frame, paused, updated, tap, toggle }
}

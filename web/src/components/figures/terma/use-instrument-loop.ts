"use client"

import { useEffect, useRef, useState } from "react"
import { telemetryFrame, type DeviceSelection } from "@/lib/device-telemetry"
import { activityPainter } from "./paint-activity"
import { DEVICE_FOCUS } from "./generated-view"

export function useInstrumentLoop(zone: string, selection: DeviceSelection, inspectWetBulb = false) {
  const root = useRef<HTMLElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const running = useRef(true)
  const allowMotion = useRef(false)
  const lastTap = useRef(-Infinity)
  const [reducedMotion, setReducedMotion] = useState(false)
  const selectionRef = useRef(selection)
  const inspectionRef = useRef(inspectWetBulb)
  const zoneRef = useRef(zone)
  const elapsed = useRef(0)
  const taps = useRef(0)
  const requestPaint = useRef<() => void>(() => {})
  const [frame, setFrame] = useState(() => telemetryFrame(0, zone))
  const [paused, setPaused] = useState(false)
  const [updated, setUpdated] = useState("")
  useEffect(() => { selectionRef.current = selection; requestPaint.current() }, [selection])
  useEffect(() => { inspectionRef.current = inspectWetBulb; requestPaint.current() }, [inspectWetBulb])
  useEffect(() => { zoneRef.current = zone; setFrame(telemetryFrame(elapsed.current, zone, 12, taps.current)) }, [zone])
  useEffect(() => {
    const node = root.current
    const drawing = svg.current
    if (!node || !drawing) return
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    let visible = true, previous = 0, lastRead = -5, raf = 0, lastVisits = 0, flash = 0
    const box: number[] = [...DEVICE_FOCUS.all]
    let paintActivity = activityPainter(node)
    const bandLed = node.querySelector<SVGGElement>('[data-part="band.led"]')
    const packetLeds = node.querySelectorAll<SVGGElement>('[data-part="station.led"],[data-part^="gateway.led-"]')
    const waterLed = node.querySelector<SVGGElement>('[data-part="water.reader-led"]')
    const lamps = node.querySelectorAll<SVGCircleElement>('[data-signal]')
    function paint(time: number) {
      if (!visible || document.hidden) return
      const still = motion.matches && !allowMotion.current
      const dt = previous ? Math.min((time - previous) / 1000, .1) : 0
      previous = time
      const active = visible && !document.hidden && running.current
      node!.dataset.running = String(active && !still)
      if (active && !still) elapsed.current += dt
      const target = inspectionRef.current && selectionRef.current === "station" ? DEVICE_FOCUS.wetbulb : DEVICE_FOCUS[selectionRef.current]
      const ease = still ? 1 : 1 - Math.exp(-dt * 8)
      for (let i = 0; i < 4; i++) box[i] += (target[i] - box[i]) * ease
      drawing!.setAttribute("viewBox", box.map(value => value.toFixed(2)).join(" "))
      const sample = telemetryFrame(elapsed.current, zoneRef.current, 12, taps.current)
      if (active && (elapsed.current - lastRead >= 5 || sample.visits !== lastVisits)) {
        setFrame(sample); setUpdated(new Date().toLocaleTimeString("id-ID")); lastRead = elapsed.current
      }
      paintActivity(elapsed.current, sample, lastTap.current)
      const pulse = still || !active ? .8 : .45 + .55 * Math.pow(Math.max(0, Math.sin(elapsed.current * sample.heartRate / 60 * Math.PI * 2)), 6)
      if (sample.visits !== lastVisits) { flash = 1; lastVisits = sample.visits }
      else flash *= Math.exp(-dt * 5)
      waterLed?.setAttribute("opacity", String(still ? .8 : .4 + flash * .6))
      bandLed?.setAttribute("opacity", String(pulse))
      const packetPhase = (elapsed.current % 5) / 5
      packetLeds.forEach(lamp => lamp.setAttribute("opacity", String(still || !active ? .8 : .45 + .55 * Math.exp(-packetPhase * 15))))
      lamps.forEach((lamp, index) => {
        const phase = still || !active ? .25 : (elapsed.current / 5 + index / 4) % 1
        lamp.setAttribute("r", String(3 + phase * 14))
        lamp.setAttribute("opacity", String(still || !active ? .15 : (1 - phase) * .42))
      })
      const moving = box.some((value, index) => Math.abs(value - target[index]) > .05)
      if ((active && !still) || moving) raf = requestAnimationFrame(paint)
    }
    const activate = () => {
      cancelAnimationFrame(raf); previous = 0
      setReducedMotion(motion.matches && !allowMotion.current)
      node.dataset.running = String(visible && !document.hidden && running.current && !(motion.matches && !allowMotion.current))
      paintActivity = activityPainter(node)
      if (visible && !document.hidden) raf = requestAnimationFrame(paint)
    }
    requestPaint.current = activate
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; activate() }, { threshold: .05 })
    observer.observe(node)
    document.addEventListener("visibilitychange", activate)
    const preference = () => { allowMotion.current = false; activate() }
    motion.addEventListener("change", preference)
    activate()
    return () => { cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener("visibilitychange", activate); motion.removeEventListener("change", preference); requestPaint.current = () => {} }
  }, [])
  function tap() {
    taps.current++
    lastTap.current = elapsed.current
    setFrame(telemetryFrame(elapsed.current, zoneRef.current, 12, taps.current))
    setUpdated(new Date().toLocaleTimeString("id-ID"))
    requestPaint.current()
  }
  function toggle() {
    if (reducedMotion) { allowMotion.current = true; running.current = true; setReducedMotion(false); setPaused(false) }
    else { running.current = !running.current; setPaused(!running.current) }
    requestPaint.current()
  }
  return { root, svg, frame, paused, reducedMotion, updated, tap, toggle }
}

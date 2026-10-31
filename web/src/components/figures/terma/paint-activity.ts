import { DEVICE_ANCHORS, DEVICE_SURFACES } from "./generated-view"
import { ecgPath, instrumentMotion, packetPoint } from "./instrument-motion"
import type { telemetryFrame } from "@/lib/device-telemetry"

export function activityPainter(root: HTMLElement) {
  const packets = (["station", "water", "band"] as const).flatMap(device =>
    [...root.querySelectorAll<SVGCircleElement>(`[data-packet="${device}"]`)].map(element => ({ element, from: DEVICE_ANCHORS[device], offset: Number(element.dataset.offset) })))
  const routes = root.querySelectorAll<SVGPathElement>(".iot-data-route")
  const ecgs = [...root.querySelectorAll<SVGPathElement>("[data-ecg]")].map(element => ({ element, width: Number(element.dataset.width), height: Number(element.dataset.height) }))
  const scan = root.querySelector<SVGRectElement>("[data-rfid-scan]")
  const flash = root.querySelector<SVGRectElement>("[data-rfid-flash]")
  const bar = root.querySelector<SVGRectElement>("[data-station-bar]")
  const heartbeat = root.querySelector<SVGCircleElement>("[data-heartbeat-halo]")
  const receive = root.querySelector<SVGCircleElement>("[data-gateway-receive]")
  return (seconds: number, sample: ReturnType<typeof telemetryFrame>, lastTap: number) => {
    const motion = instrumentMotion(seconds, sample.heartRate, lastTap)
    let arrival = 0
    packets.forEach(({ element, from, offset }) => {
      const phase = (seconds / 5 + offset) % 1
      const [x, y] = packetPoint(from, DEVICE_ANCHORS.gateway, phase)
      element.setAttribute("cx", x.toFixed(2)); element.setAttribute("cy", y.toFixed(2))
      element.setAttribute("opacity", String(.15 + .85 * Math.sin(phase * Math.PI)))
      arrival = Math.max(arrival, Math.exp(-Math.pow((phase - .94) / .08, 2)))
    })
    routes.forEach(element => element.setAttribute("stroke-dashoffset", String(-seconds * 10)))
    ecgs.forEach(({ element, width, height }) => element.setAttribute("d", ecgPath(seconds, sample.heartRate, width, height)))
    scan?.setAttribute("y", String(motion.scan * (DEVICE_SURFACES.rfid.height - 2.8)))
    scan?.setAttribute("opacity", String(motion.scanOpacity))
    flash?.setAttribute("opacity", String(motion.scanning ? .1 : .03))
    bar?.setAttribute("width", String(Math.max(2, Math.min(19, (sample.wbgt - 20) / 15 * 19))))
    heartbeat?.setAttribute("r", String(9 + motion.beat * 18)); heartbeat?.setAttribute("opacity", String(.08 + motion.beat * .35))
    receive?.setAttribute("r", String(6 + arrival * 14)); receive?.setAttribute("opacity", String(.1 + arrival * .5))
  }
}

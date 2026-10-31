import { RFID_CYCLE_SECONDS, RFID_SCAN_SECONDS } from "../../../lib/device-telemetry"

export type ScreenPoint = readonly [number, number]
const phaseOf = (value: number) => ((value % 1) + 1) % 1

export function packetPoint(from: ScreenPoint, to: ScreenPoint, phase: number): ScreenPoint {
  const t = Math.max(0, Math.min(1, phase)), u = 1 - t
  const control = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 65]
  return [u * u * from[0] + 2 * u * t * control[0] + t * t * to[0], u * u * from[1] + 2 * u * t * control[1] + t * t * to[1]]
}

export function packetPath(from: ScreenPoint, to: ScreenPoint) {
  return `M${from[0]} ${from[1]} Q${(from[0] + to[0]) / 2} ${Math.min(from[1], to[1]) - 65} ${to[0]} ${to[1]}`
}

export function instrumentMotion(seconds: number, heartRate: number, lastTap = -Infinity) {
  const sinceTap = seconds - lastTap
  const scanAge = sinceTap >= 0 && sinceTap < RFID_SCAN_SECONDS ? sinceTap : seconds % RFID_CYCLE_SECONDS
  const scan = Math.min(1, scanAge / RFID_SCAN_SECONDS)
  const beat = Math.pow(Math.max(0, Math.sin(seconds * heartRate / 60 * Math.PI * 2)), 6)
  return { scan, scanning: scanAge < RFID_SCAN_SECONDS, scanOpacity: scanAge < RFID_SCAN_SECONDS ? .35 + .65 * Math.sin(scan * Math.PI) : 0, beat }
}

/** Rolling signal trace for the display, tied to the same displayed beats per minute. */
export function ecgPath(seconds: number, heartRate: number, width: number, height: number) {
  const bump = (phase: number, centre: number, spread: number) => Math.exp(-Math.pow((phase - centre) / spread, 2))
  return Array.from({ length: 81 }, (_, index) => {
    const x = index / 80
    const phase = phaseOf(x * 2 - seconds * heartRate / 60)
    const wave = .12 * bump(phase, .18, .04) - .2 * bump(phase, .36, .018) + .95 * bump(phase, .4, .018) - .3 * bump(phase, .44, .022) + .23 * bump(phase, .68, .07)
    return `${index ? "L" : "M"}${(x * width).toFixed(2)} ${(height * (.62 - wave * .48)).toFixed(2)}`
  }).join(" ")
}

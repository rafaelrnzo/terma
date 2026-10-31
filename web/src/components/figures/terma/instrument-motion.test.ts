import { describe, expect, it } from "vitest"
import { telemetryFrame, RFID_SCAN_SECONDS, RFID_CYCLE_SECONDS } from "../../../lib/device-telemetry"
import { ecgPath, instrumentMotion, packetPoint } from "./instrument-motion"

describe("instrument activity", () => {
  it("starts and lands a packet exactly on its physical device anchors", () => {
    expect(packetPoint([10, 100], [200, 150], 0)).toEqual([10, 100])
    expect(packetPoint([10, 100], [200, 150], 1)).toEqual([200, 150])
    const middle = packetPoint([10, 100], [200, 150], .5)
    expect(middle[0]).toBe(105)
    expect(middle[1]).toBeLessThan(100)
  })
  it("finishes an automatic RFID scan when the same model records the visit", () => {
    expect(instrumentMotion(RFID_SCAN_SECONDS - .01, 82).scanning).toBe(true)
    expect(telemetryFrame(RFID_SCAN_SECONDS - .01).visits).toBe(0)
    expect(instrumentMotion(RFID_SCAN_SECONDS, 82).scanning).toBe(false)
    expect(telemetryFrame(RFID_SCAN_SECONDS).visits).toBe(1)
    expect(telemetryFrame(RFID_CYCLE_SECONDS + RFID_SCAN_SECONDS).visits).toBe(2)
  })
  it("a manual tap triggers a visible scan even between automatic cycles", () => {
    const scan = instrumentMotion(7.5, 82, 7)
    expect(scan.scanning).toBe(true)
    expect(scan.scan).toBe(.25)
    expect(scan.scanOpacity).toBeGreaterThan(.5)
    expect(instrumentMotion(10, 82, 7).scanning).toBe(false)
  })
  it("the ECG repeats after one heartbeat and changes between frames", () => {
    const period = 60 / 80
    expect(ecgPath(0, 80, 220, 48)).toBe(ecgPath(period, 80, 220, 48))
    expect(ecgPath(.1, 80, 220, 48)).not.toBe(ecgPath(0, 80, 220, 48))
    expect(ecgPath(.1, 80, 20, 11)).not.toContain("NaN")
  })
})

import { describe, expect, it } from "vitest"
import { telemetryFrame } from "./device-telemetry"


describe("device workbench animation", () => {
  it("drives readouts, visits and packet counts from one deterministic frame", () => {
    expect(telemetryFrame(24, "COR_B", 12)).toEqual(telemetryFrame(24, "COR_B", 12))
    const before = telemetryFrame(24, "COR_B", 12)
    const after = telemetryFrame(24, "COR_B", 12, 1)
    expect(after.visits).toBe(before.visits + 1)
    expect(after.packets).toBe(before.packets + 1)
    expect(after.wbgt).toBeGreaterThan(telemetryFrame(24, "GUDANG", 12).wbgt)
  })
})

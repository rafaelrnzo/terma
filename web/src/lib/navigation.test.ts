import { describe, expect, it } from "vitest"
import { NAV_GROUPS, SHIFT_ROUTES, navigationGroup } from "./navigation"

describe("shift-oriented navigation", () => {
  it("provides five entry points and makes shifts the primary workspace", () => {
    expect(NAV_GROUPS.map(group => group.label)).toEqual(["Shift kerja", "Data pekerja", "Analitik", "Perangkat IoT", "Laporan"])
    expect(navigationGroup("/")).toBeUndefined()
  })
  it("keeps all operational pages inside the shift context", () => {
    for (const route of [...SHIFT_ROUTES, "/shift/2026-10-31", "/pekerja/PK01", "/regu/cor"]) expect(navigationGroup(route)).toBe(NAV_GROUPS[0])
    expect(NAV_GROUPS[0].routes).toHaveLength(1)
  })
  it("separates reusable workers and cross-shift analysis from execution", () => {
    expect(navigationGroup("/impor")).toBe(NAV_GROUPS[1])
    expect(navigationGroup("/analitik")).toBe(NAV_GROUPS[2])
    expect(navigationGroup("/laporan")).toBe(NAV_GROUPS[4])
  })
})

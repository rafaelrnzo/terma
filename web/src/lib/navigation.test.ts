import { describe, expect, it } from "vitest"
import { NAV_GROUPS, navigationGroup } from "./navigation"
import { SURFACES } from "./workspace"

describe("task-based navigation", () => {
  it("separates the introduction from five operational groups", () => {
    expect(NAV_GROUPS).toHaveLength(5)
    expect(navigationGroup("/")).toBeUndefined()
    expect(navigationGroup("/ringkasan")?.label).toBe("Dashboard")
    expect(SURFACES.some(s => s.href === "/")).toBe(true)
    expect(SURFACES.some(s => s.href === "/ringkasan")).toBe(true)
  })
  it("keeps every daily workflow reachable", () => {
    const routes = NAV_GROUPS.flatMap(g => g.routes.map(r => r.href))
    expect(new Set(routes).size).toBe(9)
    for (const path of ["/impor", "/paparan", "/pengukuran", "/rencana", "/insight", "/instruksi", "/tindakan", "/laporan"]) expect(routes).toContain(path)
  })
  it("keeps worker and crew details inside field data", () => {
    expect(navigationGroup("/pekerja/DEMO001")?.label).toBe("Data lapangan")
    expect(navigationGroup("/regu/cor")?.label).toBe("Data lapangan")
    expect(navigationGroup("/instruksi")?.label).toBe("Tindak lanjut")
  })
})

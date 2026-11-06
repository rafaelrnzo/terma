import { describe, expect, it } from "vitest"
import { NAV_GROUPS, SHIFT_ROUTES, navigationGroup, navigationFor, roleHomePath, isShiftRoute, pageAllowedFor } from "./navigation"
import { USERS } from "./config"

describe("role workspaces", () => {
  it("lands each role on its own surface", () => {
    expect(USERS.map(user => roleHomePath(user))).toEqual(["/hse", "/mandor", "/mandor", "/admin", "/klinik"])
    for (const user of USERS) expect(navigationGroup(roleHomePath(user))).toBe(NAV_GROUPS[0])
    expect(navigationGroup("/")).toBeUndefined()
  })
  it("keeps operational pages in a single shift context", () => {
    for (const route of [...SHIFT_ROUTES, "/pekerja/PK01", "/regu/cor"]) expect(isShiftRoute(route)).toBe(true)
    expect(navigationGroup("/shift/2026-10-31")).toBe(NAV_GROUPS[0])
    for (const route of ["/paparan", "/rencana", "/instruksi", "/tindakan", "/pekerja/PK01"]) expect(navigationGroup(route)?.href).toBe("/rencana")
    expect(navigationGroup("/pengukuran")?.href).toBe("/monitoring")
  })
  it("exposes forecasting and monitoring as distinct destinations", () => {
    expect(navigationGroup("/forecasting")?.href).toBe("/forecasting")
    expect(navigationGroup("/monitoring")?.href).toBe("/monitoring")
    expect(navigationGroup("/perangkat")?.href).toBe("/monitoring")
    expect(navigationGroup("/absensi")?.href).toBe("/monitoring")
    expect(navigationGroup("/analitik")?.href).toBe("/laporan")
  })
  it("keeps foreman operations available without exposing HSE decisions", () => {
    const operations = navigationFor(USERS[1]).find(group=>group.href==="/rencana")!
    expect(operations.routes.filter(route=>pageAllowedFor(USERS[1],route.href)).map(route=>route.href)).toEqual(["/instruksi","/tindakan"])
    expect(navigationFor(USERS[3]).some(group=>group.href==="/rencana")).toBe(false)
  })
  it("removes master-data navigation from the foreman workspace", () => {
    expect(navigationFor(USERS[1]).some(group => group.href === "/impor")).toBe(false)
    expect(navigationFor(USERS[0]).some(group => group.href === "/impor")).toBe(true)
    expect(navigationFor(USERS[3]).some(group => group.href === "/impor")).toBe(true)
  })
})

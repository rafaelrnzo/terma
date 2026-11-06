import { describe, expect, it } from "vitest"
import { NAV_GROUPS, SHIFT_ROUTES, navigationGroup, navigationFor, roleHomePath } from "./navigation"
import { USERS } from "./config"

describe("role workspaces", () => {
  it("lands each role on its own surface", () => {
    expect(USERS.map(user => roleHomePath(user))).toEqual(["/hse", "/mandor", "/mandor", "/admin", "/klinik"])
    for (const user of USERS) expect(navigationGroup(roleHomePath(user))).toBe(NAV_GROUPS[0])
    expect(navigationGroup("/")).toBeUndefined()
  })
  it("keeps operational pages in a single shift context", () => {
    for (const route of [...SHIFT_ROUTES, "/shift/2026-10-31", "/pekerja/PK01", "/regu/cor"]) expect(navigationGroup(route)).toBe(NAV_GROUPS[0])
  })
  it("exposes forecasting and monitoring as distinct destinations", () => {
    expect(navigationGroup("/forecasting")?.href).toBe("/forecasting")
    expect(navigationGroup("/monitoring")?.href).toBe("/monitoring")
    expect(navigationGroup("/perangkat")?.href).toBe("/monitoring")
    expect(navigationGroup("/absensi")?.href).toBe("/monitoring")
    expect(navigationGroup("/analitik")?.href).toBe("/laporan")
  })
  it("removes master-data navigation from the foreman workspace", () => {
    expect(navigationFor(USERS[1]).some(group => group.href === "/impor")).toBe(false)
    expect(navigationFor(USERS[0]).some(group => group.href === "/impor")).toBe(true)
    expect(navigationFor(USERS[3]).some(group => group.href === "/impor")).toBe(true)
  })
})

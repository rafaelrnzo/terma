import { describe, expect, it } from "vitest"
import { NAV_GROUPS, SHIFT_ROUTES, navigationGroup, navigationFor, roleHomePath, isShiftRoute, pageAllowedFor } from "./navigation"
import { SYSTEM_USER_ID, USERS } from "./config"

describe("role workspaces", () => {
  it("lands each role on its own surface", () => {
    const people = USERS.filter(user => user.id !== SYSTEM_USER_ID) // the system account never signs in
    expect(people.map(user => roleHomePath(user))).toEqual(["/hse", "/mandor", "/mandor", "/admin", "/klinik", "/pengelola", "/pegawai"])
    for (const user of people) expect(navigationGroup(roleHomePath(user))).toBe(NAV_GROUPS[0])
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
    expect(NAV_GROUPS.flatMap(group=>group.routes).some(route=>route.href==="/absensi")).toBe(false)
    expect(navigationGroup("/analitik")?.href).toBe("/monitoring")
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
  it("opens worker monitoring without requiring a shift and restricts clinical access", () => {
    const path="/pemantauan/CMP001"
    expect(isShiftRoute(path)).toBe(false)
    expect(navigationGroup(path)?.href).toBe("/impor")
    for(const user of USERS) expect(pageAllowedFor(user,path)).toBe(["HSE", "KLINIK", "ADMIN"].includes(user.role))
  })

  it("shows the demo assistant only to HSE and admin", () => {
    for (const user of USERS.filter(row => row.id !== SYSTEM_USER_ID)) {
      expect(pageAllowedFor(user, "/asisten")).toBe(["HSE", "ADMIN"].includes(user.role))
      expect(navigationFor(user).some(group => group.href === "/asisten")).toBe(["HSE", "ADMIN"].includes(user.role))
    }
  })

  it("keeps report consolidation available to Clinic without granting shift-report access",()=>{
    const clinic=USERS.find(user=>user.role==="KLINIK")!
    expect(pageAllowedFor(clinic,"/laporan/bulanan")).toBe(true)
    expect(pageAllowedFor(clinic,"/laporan")).toBe(false)
    expect(navigationGroup("/laporan/bulanan")?.href).toBe("/laporan")
  })

})

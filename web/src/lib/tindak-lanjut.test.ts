import { describe, expect, it } from "vitest"
import { cocokPencarianTindakan, kelompokTindakan } from "./tindak-lanjut"
import { reducer, stateAwal } from "./store"
import type { ActionLifecycle } from "./types"

const state = reducer(stateAwal("2026-10-25"), { type: "MUAT_DEMO" })
const action = state.tindakan[0]

describe("action presentation", () => {
  it.each([
    ["DIBUAT", "MENUNGGU"], ["DISAMPAIKAN", "MENUNGGU"], ["DIAKUI", "MENUNGGU"],
    ["TINDAKAN_DILAPORKAN", "VERIFIKASI"], ["TERVERIFIKASI", "TERVERIFIKASI"], ["BELUM_SELESAI", "BELUM_SELESAI"],
  ])("groups %s without changing its lifecycle", (status, group) => {
    const t = { ...action, status: status as ActionLifecycle }
    expect(kelompokTindakan(t, false)).toBe(group)
    expect(t.status).toBe(status)
  })
  it("keeps superseded actions out of the verification queue", () => {
    expect(kelompokTindakan({ ...action, status: "TINDAKAN_DILAPORKAN" }, true)).toBe("DIBATALKAN")
  })
  it("matches names and identifiers case-insensitively with whitespace", () => {
    expect(cocokPencarianTindakan(action, "Andi (demo)", "  ANDI  demo ")).toBe(true)
    expect(cocokPencarianTindakan(action, "Andi (demo)", action.id)).toBe(true)
    expect(cocokPencarianTindakan(action, "Andi (demo)", "  ")).toBe(true)
    expect(cocokPencarianTindakan(action, "Andi (demo)", "tidakcocok")).toBe(false)
  })
})

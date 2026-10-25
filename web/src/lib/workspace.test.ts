import { describe, expect, it } from "vitest"
import { USERS } from "./config"
import { initialDemoState, readDemoState, DEMO_STORAGE_KEY } from "./store"
import { attentionItems, searchWorkspace, tanggalLabel, scopedWorkspace } from "./workspace"

describe("mock workspace", () => {
  const s = initialDemoState("2026-10-25")
  it("starts populated and isolated from existing operational storage", () => {
    expect(DEMO_STORAGE_KEY).not.toBe("terma-v1")
    expect(s.demo?.tanggal).toBe("2026-10-25")
    expect(s.pekerja).toHaveLength(8)
    expect(s.rencana).toHaveLength(8)
    expect(s.notice).toBeUndefined()
  })
  it("roundtrips the entire mock scenario", () => expect(readDemoState(JSON.stringify(s))).toEqual(s))
  it("rejects malformed storage without silently converting real data", () => {
    for (const raw of ["bad", "{}", JSON.stringify({ ...s, demo: undefined }), JSON.stringify({ ...s, pekerja: [null] }), JSON.stringify({ ...s, tanggal: "2026-99-99" })]) expect(() => readDemoState(raw)).toThrow()
  })
  it("searches names and ids without case sensitivity", () => expect(searchWorkspace(s, USERS[0], "  demo001  ").map(r => r.href)).toEqual(["/pekerja/DEMO001"]))
  it("search returns no unrelated records", () => expect(searchWorkspace(s, USERS[0], "nonexistent-person")).toHaveLength(0))
  it("does not leak other crews through search", () => {
    const results = searchWorkspace(s, USERS[1], "DEMO").filter(r => r.kind === "Pekerja")
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r => r.detail.endsWith("Regu COR"))).toBe(true)
  })
  it("attention links are unfinished and actionable by the chosen role", () => {
    for (const u of USERS) expect(attentionItems(s, u).every(i => !i.selesai && i.peran.includes(u.role) && i.no !== "7")).toBe(true)
  })
  it("formats the chosen calendar day without timezone drift", () => expect(tanggalLabel("2026-10-25")).toBe("25 Oktober 2026"))
  it("scopes report and adaptation records without changing the shared demo", () => {
    const scoped = scopedWorkspace(s, USERS[1])
    expect(scoped.pekerja).toHaveLength(4)
    expect(scoped.pekerja.every(p => p.reguKode === "COR")).toBe(true)
    expect(scoped.rencana.every(r => scoped.pekerja.some(p => p.kode === r.pekerjaKode))).toBe(true)
    expect(scoped.audit).toEqual([])
    expect(s.pekerja).toHaveLength(8)
    expect(scopedWorkspace(s, USERS[0])).toBe(s)
  })
})

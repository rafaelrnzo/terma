import { describe, expect, it } from "vitest"
import { bandDemoGuide } from "./band-demo-guide"
import { USERS } from "./config"
import { rayaDemoWorkspace } from "./raya-demo"
import type { PersonalDeviceEvent } from "./personal-telemetry"

const date = "2026-11-10"
const now = Date.parse(`${date}T09:00:00+07:00`)
const admin = USERS.find(user => user.role === "ADMIN")!
const reading: PersonalDeviceEvent = { id: "band-live", type: "BAND_READING", pekerjaKode: "RAYA001", deviceId: "BAND-01", observedAt: `${date}T08:59:00+07:00`, origin: "AKTUAL", heartRate: 80, skinTemperature: 34, quality: "VALID" }

function readyState() {
  const state = rayaDemoWorkspace(date)
  const management = state.management!
  management.clinic = { consents: [{ pekerjaKode: "RAYA001", jenis: "BAND", aktif: true, waktu: `${date}T07:00:00+07:00`, oleh: admin.id }], profiles: [], followups: [] }
  const shift = management.shifts[0]
  shift.status = "ACTIVE"
  shift.bands = [{ id: "band-assignment", bandId: "BAND-01", pekerjaKode: "RAYA001", ditugaskanPada: `${date}T07:30:00+07:00`, dipakaiPada: `${date}T08:00:00+07:00`, oleh: admin.id }]
  shift.personalTelemetry = [reading]
  return state
}

describe("Raya Band setup guide", () => {
  it("points a new demo at the actual missing step without changing records", () => {
    const state = rayaDemoWorkspace(date)
    const before = JSON.stringify(state)
    const steps = bandDemoGuide(state, admin, now)
    expect(steps.find(step => !step.complete)?.id).toBe("consent")
    expect(steps.find(step => step.id === "reading")?.complete).toBe(false)
    expect(JSON.stringify(state)).toBe(before)
  })

  it("finishes only with consent, handoff and fresh actual readings for Raya", () => {
    const state = readyState()
    expect(bandDemoGuide(state, admin, now).every(step => step.complete)).toBe(true)
    state.management!.shifts[0].status = "DRAFT"
    expect(bandDemoGuide(state, admin, now).every(step => step.complete)).toBe(true)
    state.management!.clinic!.consents[0].aktif = false
    const steps = bandDemoGuide(state, admin, now)
    expect(steps.find(step => !step.complete)?.id).toBe("consent")
    expect(steps.find(step => step.id === "reading")?.complete).toBe(false)
  })

  it("does not present replay, stale, other-worker or pre-handoff readings as live", () => {
    for (const event of [{ ...reading, origin: "REPLAY" as const }, { ...reading, observedAt: `${date}T08:50:00+07:00` }, { ...reading, pekerjaKode: "OTHER" }, { ...reading, observedAt: `${date}T07:59:00+07:00` }]) {
      const state = readyState()
      state.management!.shifts[0].personalTelemetry = [event]
      expect(bandDemoGuide(state, admin, now).find(step => step.id === "reading")?.complete).toBe(false)
    }
  })
})

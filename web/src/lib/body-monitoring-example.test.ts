import { describe, expect, it } from "vitest"
import { exampleBodyMonitoring } from "./body-monitoring-example"
import { bodyMonitoring } from "./body-monitoring"
import { syncCompanyData } from "./company-data"
import { emptyWorkspaceState } from "./store"
import { USERS } from "./config"

describe("filled body monitoring examples", () => {
  it("fills all five signals without creating operational or clinical records", () => {
    const state = syncCompanyData(emptyWorkspaceState("2026-11-06"))
    const before = JSON.stringify(state)
    const saved = bodyMonitoring(state, USERS[0], "CMP001", "2026-11-06", Date.parse("2026-11-06T13:40:00+07:00"))!
    expect(saved.signals.every(signal => signal.tone === "unknown")).toBe(true)
    const example = exampleBodyMonitoring("CMP001", "2026-11-06", false)
    expect(example.signals).toHaveLength(5)
    expect(example.signals.every(signal => signal.tone !== "unknown" && signal.source.startsWith("Ilustrasi"))).toBe(true)
    expect(JSON.stringify(state)).toBe(before)
    expect(bodyMonitoring(state, USERS[0], "CMP001", "2026-11-06", Date.parse("2026-11-06T13:40:00+07:00"))).toEqual(saved)
  })

  it("provides stable, varied scenarios including hydration attention and controlled conditions", () => {
    const examples = Array.from({ length: 8 }, (_, index) => exampleBodyMonitoring(`CMP00${index + 1}`, "2026-11-06", false))
    expect(new Set(examples.map(example => example.scenario)).size).toBe(3)
    expect(examples.some(example => example.signals.find(signal => signal.key === "hydration")?.tone === "attention")).toBe(true)
    expect(examples.some(example => example.signals.every(signal => signal.tone === "recorded"))).toBe(true)
    expect(exampleBodyMonitoring("CMP001", "2026-11-06", false)).toEqual(examples[0])
  })

  it("keeps raw example Band values on Clinic and dates the complete snapshot consistently", () => {
    const hse = exampleBodyMonitoring("CMP002", "2026-10-20", false)
    const clinic = exampleBodyMonitoring("CMP002", "2026-10-20", true)
    expect(hse.signals.find(signal => signal.key === "band")?.value).not.toMatch(/bpm|°C/)
    expect(clinic.signals.find(signal => signal.key === "band")?.value).toMatch(/bpm.*°C/)
    for (const signal of clinic.signals) {
      expect(signal.observedAt?.slice(0, 10)).toBe("2026-10-20")
      expect(Date.parse(signal.observedAt!)).toBeLessThanOrEqual(clinic.asOf)
    }
    expect(clinic.clinicalNote).toBeUndefined()
  })
})

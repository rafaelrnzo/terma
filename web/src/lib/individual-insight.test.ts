import { describe, expect, it } from "vitest"
import { individualInsight, simulateZone } from "./individual-insight"
import { reducer, rencanaAktif, stateAwal } from "./store"

const demo = () => rencanaAktif(reducer(stateAwal("2026-10-25"), { type: "MUAT_DEMO" }))
const plan = (code: string) => demo().find(item => item.pekerjaKode === code)!

describe("individual insight preview", () => {
  it("keeps an absent plan unknown rather than assigning a health category", () => {
    const result = individualInsight()
    expect(result.level).toBe("BELUM_ADA")
    expect(result.peakIsbb).toBeNull()
    expect(result.plannedMinutes).toBe(0)
  })

  it("does not treat forecast-only intervals as measured or imply a safe prediction", () => {
    const result = individualInsight(plan("DEMO004"))
    expect(result.level).toBe("DATA_KURANG")
    expect(result.validIntervals).toBe(0)
    expect(result.missingIntervals).toBe(8)
    expect(result.peakIsbb).toBeNull()
    expect(result.actions.join(" ")).toContain("pengukuran WBGT")
  })

  it("distinguishes blocked intervals and adaptation from measured routine plans", () => {
    expect(individualInsight(plan("DEMO002")).level).toBe("BATASI")
    expect(individualInsight(plan("DEMO001")).level).toBe("ADAPTASI")
    expect(individualInsight(plan("DEMO006")).level).toBe("PANTAU")
  })

  it("keeps a blocked interval prominent even when another interval lacks data", () => {
    const current = plan("DEMO002")
    const changed = { ...current, intervals: current.intervals.map((interval, index) => index === 0 ? { ...interval, kualitas: "TIDAK_TERSEDIA" as const, isbb: null } : interval) }
    const result = individualInsight(changed)
    expect(result.level).toBe("BATASI")
    expect(result.missingIntervals).toBe(1)
    expect(result.blockedIntervals).toBeGreaterThan(0)
  })

  it("compares another zone without mutating the approved plan or filling gaps with forecasts", () => {
    const state = reducer(stateAwal("2026-10-25"), { type: "MUAT_DEMO" })
    const worker = state.pekerja.find(item => item.kode === "DEMO002")!
    const before = JSON.stringify(state)
    const shaded = simulateZone(state, worker, "GUDANG")!
    expect(shaded.blockedIntervals).toBe(0)
    expect(shaded.missingIntervals).toBe(0)
    expect(shaded.plannedMinutes).toBeGreaterThan(individualInsight(plan("DEMO002")).plannedMinutes)
    expect(JSON.stringify(state)).toBe(before)

    const unmeasured = simulateZone(state, worker, "BEK_A")!
    expect(unmeasured.missingIntervals).toBe(8)
    expect(unmeasured.plannedMinutes).toBe(0)
  })
})

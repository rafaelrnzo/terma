import { describe, expect, it } from "vitest"
import { DEMO_BRIEFINGS, DEMO_PROMPTS, briefingKindFor } from "./ai-briefing-demo"

describe("demo briefing", () => {
  it("resolves every suggested question to its prepared answer", () => {
    for (const prompt of DEMO_PROMPTS) {
      expect(briefingKindFor(prompt.label)).toBe(prompt.kind)
      expect(DEMO_BRIEFINGS[prompt.kind].points.length).toBeGreaterThan(0)
    }
  })

  it("keeps unsupported free-form questions in the demo guidance flow", () => {
    expect(briefingKindFor("Berapa biaya proyek?")).toBe("bantuan")
    expect(DEMO_BRIEFINGS.bantuan.points).toEqual([])
  })
})

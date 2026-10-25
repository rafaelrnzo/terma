import { describe, expect, it } from "vitest"
import { ZONA } from "./config"
import { DEMO_MAP_CENTER, DEMO_ZONE_POSITIONS } from "./zone-map"

describe("illustrative zone geometry", () => {
  it("provides one stable selectable position per configured zone", () => {
    expect(Object.keys(DEMO_ZONE_POSITIONS).sort()).toEqual(ZONA.map(z => z.kode).sort())
    for (const position of Object.values(DEMO_ZONE_POSITIONS)) {
      expect(position.x).toBeGreaterThan(20)
      expect(position.x).toBeLessThan(80)
      expect(position.y).toBeGreaterThan(20)
      expect(position.y).toBeLessThan(80)
      expect(Math.abs(position.point[0] - DEMO_MAP_CENTER[0])).toBeLessThan(.01)
      expect(Math.abs(position.point[1] - DEMO_MAP_CENTER[1])).toBeLessThan(.01)
    }
  })
})

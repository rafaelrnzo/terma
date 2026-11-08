/** Fictional demo positions, not a survey, project address or worker tracking. */
export const DEMO_ZONE_POSITIONS: Record<string, { point: [number, number]; x: number; y: number; color: string; label: string }> = {
  COR_B: { point: [106.827, -6.176], x: 25, y: 28, color: "var(--zone-blue)", label: "Cor B" },
  BEK_A: { point: [106.831, -6.176], x: 75, y: 28, color: "var(--zone-ice)", label: "Bekisting A" },
  GUDANG: { point: [106.829, -6.179], x: 50, y: 75, color: "var(--zone-steel)", label: "Gudang" },
}

export const DEMO_MAP_CENTER: [number, number] = [106.829, -6.1775]

export type PlacedPoint = { zonaKode: string; lat: number; lng: number }

/** Installed Station position for the zone when recorded; otherwise an illustrative offset around the site reference. */
export function zonePoint(code: string, center: [number, number], placements: PlacedPoint[] = []): [number, number] | null {
  const placed = placements.find(row => row.zonaKode === code)
  if (placed) return [placed.lng, placed.lat]
  const position = DEMO_ZONE_POSITIONS[code]
  return position ? [center[0] + position.point[0] - DEMO_MAP_CENTER[0], center[1] + position.point[1] - DEMO_MAP_CENTER[1]] : null
}

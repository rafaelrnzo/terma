/** Fictional demo positions, not a survey, project address or worker tracking. */
export const DEMO_ZONE_POSITIONS: Record<string, { point: [number, number]; x: number; y: number; color: string; label: string }> = {
  COR_B: { point: [106.827, -6.176], x: 25, y: 28, color: "var(--zone-blue)", label: "Cor B" },
  BEK_A: { point: [106.831, -6.176], x: 75, y: 28, color: "var(--zone-lime)", label: "Bekisting A" },
  GUDANG: { point: [106.829, -6.179], x: 50, y: 75, color: "var(--zone-sage)", label: "Gudang" },
}

export const DEMO_MAP_CENTER: [number, number] = [106.829, -6.1775]

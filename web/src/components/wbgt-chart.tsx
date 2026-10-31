"use client"

import { useReducedMotion } from "motion/react"
import { curveLinear } from "d3-shape"
import { LineChart, Line } from "@/components/charts/line-chart"
import { Grid } from "@/components/charts/grid"
import { XAxis } from "@/components/charts/x-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import type { heatSeries } from "@/lib/heat-series"

export function WbgtChart({ points }: { points: ReturnType<typeof heatSeries> }) {
  const reduceMotion = useReducedMotion()
  if (points.some(point => point.value === null)) return <div className="min-h-48"><p className="inline-note">Ada interval tanpa bacaan valid. Nilai kosong tidak dihubungkan atau diganti menjadi nol.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{points.map(point => <p key={point.label} className="text-xs">{point.label} · {point.value === null ? "Belum tersedia" : `${point.value} °C`}</p>)}</div></div>
  return <LineChart data={points} aspectRatio="2.7 / 1" margin={{ top: 18, right: 16, bottom: 30, left: 16 }} animationDuration={reduceMotion ? 0 : 700} yDomainTween={!reduceMotion}>
    <Grid horizontal numTicksRows={4} />
    <Line dataKey="value" stroke="var(--chart-1)" strokeWidth={2.5} curve={curveLinear} fadeEdges={false} showMarkers animate={!reduceMotion} />
    <XAxis numTicks={4} labels={points.map(point => point.label)} />
    <ChartTooltip showDatePill={false} rows={point => [{ color: "var(--chart-1)", label: `WBGT · ${point.label}`, value: `${point.value} °C` }]} />
  </LineChart>
}

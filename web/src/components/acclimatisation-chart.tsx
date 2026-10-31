"use client"

import Link from "next/link"
import { ArrowUpRightIcon } from "@phosphor-icons/react"
import { useReducedMotion } from "motion/react"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import { ACCLIMATISATION_EXAMPLE } from "@/lib/heat-series"

export function AcclimatisationChart() {
  const reduceMotion = useReducedMotion()
  return <section className="summon-panel" aria-labelledby="accl-title">
    <div className="panel-heading"><div><h2 id="accl-title">Mulai bertahap. Adaptasi terpantau.</h2><p>Contoh pekerja baru · shift 480 menit</p></div><Link href="/paparan" className="panel-link" aria-label="Buka adaptasi pekerja"><ArrowUpRightIcon size={16} /></Link></div>
    <div className="accl-chart"><div role="img" aria-label="Contoh batas adaptasi hari 1 sampai 5: 96, 192, 288, 384, 480 menit">
      <BarChart data={ACCLIMATISATION_EXAMPLE} xDataKey="day" aspectRatio="2.5 / 1" margin={{ top: 8, left: 6, right: 6, bottom: 32 }} barGap={.3} animationDuration={reduceMotion ? 0 : 650}>
        <Bar dataKey="minutes" fill="var(--primary)" lineCap={5} showValue valueLabelFormatter={value => `${value}`} animate={!reduceMotion} />
        <BarXAxis showAllLabels />
        <ChartTooltip showDatePill={false} rows={point => [{ color: "var(--primary)", label: `${point.day}`, value: `${point.minutes} menit` }]} />
      </BarChart>
    </div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">20% → 100% selama lima hari. Ilustrasi dari proposal; batas per jam tetap mengikuti NAB dan persetujuan HSE.</p></div>
  </section>
}

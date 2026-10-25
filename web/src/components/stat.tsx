export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <dl className="min-w-0 py-2">
      <dt className="text-xs leading-relaxed text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </dl>
  )
}

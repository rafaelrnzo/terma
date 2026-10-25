import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ActionLifecycle, ActionStatus, DataOrigin, DataQuality, DeliveryStatus } from "@/lib/types"

const STATUS: Record<ActionStatus, { label: string; variant: "tersedia" | "adaptasi" | "tinjau" | "batasi" }> = {
  RENCANA_TERSEDIA: { label: "RENCANA TERSEDIA", variant: "tersedia" },
  ADAPTASI_DIPERLUKAN: { label: "ADAPTASI DIPERLUKAN", variant: "adaptasi" },
  TINJAU_HSE: { label: "TINJAU HSE", variant: "tinjau" },
  BATASI_ATAU_PINDAHKAN: { label: "BATASI ATAU PINDAHKAN", variant: "batasi" },
}

/** Action status. Color is only a navigation aid; the label is always shown. Never a health status. */
export function StatusChip({ status, className }: { status: ActionStatus; className?: string }) {
  const s = STATUS[status]
  return (
    <Badge variant={s.variant} className={cn("font-semibold", className)} aria-label={`Status tindakan: ${s.label}`}>
      {s.label}
    </Badge>
  )
}

const QUALITY: Record<DataQuality, { label: string; dot?: string; dashed?: boolean; warn?: boolean }> = {
  TERUKUR: { label: "TERUKUR", dot: "bg-primary" },
  REPLAY: { label: "REPLAY", dot: "bg-heritage-moss" },
  PRAKIRAAN_SAJA: { label: "PRAKIRAAN SAJA", dashed: true },
  KEDALUWARSA: { label: "KEDALUWARSA", warn: true },
  TIDAK_TERSEDIA: { label: "TIDAK TERSEDIA", dashed: true },
}

/** Data quality, a separate axis from the action status. Neutral styling by design. */
export function QualityBadge({ kualitas, className }: { kualitas: DataQuality; className?: string }) {
  const q = QUALITY[kualitas]
  return (
    <Badge
      variant="kualitas"
      className={cn("shrink-0 whitespace-nowrap", q.dashed && "border-dashed", q.warn && "text-destructive", className)}
      aria-label={`Kualitas data: ${q.label}`}
    >
      {q.dot && <span className={cn("size-1.5 rounded-full", q.dot)} aria-hidden />}
      {q.label}
    </Badge>
  )
}

export function OriginBadge({ origin }: { origin: DataOrigin }) {
  return (
    <Badge variant="outline" className="shrink-0 whitespace-nowrap rounded-sm text-xs text-muted-foreground">
      {origin}
    </Badge>
  )
}

const LIFECYCLE: Record<ActionLifecycle, string> = {
  DIBUAT: "DIBUAT",
  DISAMPAIKAN: "DISAMPAIKAN",
  DIAKUI: "DIAKUI",
  TINDAKAN_DILAPORKAN: "TINDAKAN DILAPORKAN",
  TERVERIFIKASI: "TERVERIFIKASI",
  BELUM_SELESAI: "BELUM SELESAI",
}

export function LifecycleBadge({ status }: { status: ActionLifecycle }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm",
        status === "TERVERIFIKASI" && "border-primary text-primary",
        status === "BELUM_SELESAI" && "border-destructive text-destructive",
      )}
    >
      {LIFECYCLE[status]}
    </Badge>
  )
}

export function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-sm", status === "GAGAL" && "border-destructive text-destructive")}>
      {status === "DIBAGIKAN_MANUAL" ? "DIBAGIKAN MANUAL" : status === "GAGAL" ? "GAGAL — belum tersampaikan" : "TERKIRIM"}
    </Badge>
  )
}

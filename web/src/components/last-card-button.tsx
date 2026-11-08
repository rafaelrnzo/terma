"use client"

import { IdentificationCardIcon } from "@phosphor-icons/react/dist/csr/IdentificationCard"
import { Button } from "@/components/ui/button"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import { useIotEvents } from "@/lib/use-iot-events"

/**
 * Fills the worker's card UID from the card most recently tapped at a Water Station, so registering
 * a card is "tap, then click" instead of copying the UID by hand. Mount only while the form is open.
 */
export function LastCardButton({ workerCode, onPick }: { workerCode?: string; onPick: (uid: string) => void }) {
  const { state } = useApp()
  const { events } = useIotEvents()
  const tap = events.findLast(event => event.type === "water")
  if (tap?.type !== "water") return <p className="text-xs text-muted-foreground">Tap kartu di Water Station, lalu kartunya bisa dipilih di sini.</p>
  const owner = managementOf(state).workers.find(worker => worker.kartuUid === tap.uid && worker.kode !== workerCode)
  const time = new Date(tap.receivedAt).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })
  return <div className="flex flex-wrap items-center gap-2">
    <Button type="button" size="sm" variant="outline" onClick={() => onPick(tap.uid)}><IdentificationCardIcon />Pakai kartu yang baru di-tap</Button>
    <span className="text-xs text-muted-foreground">{tap.uid} · {time}{owner ? ` · sudah dipakai ${owner.nama}` : ""}</span>
  </div>
}

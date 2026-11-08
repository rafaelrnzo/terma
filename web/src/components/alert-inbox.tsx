"use client"

import { useEffect, useRef, useState } from "react"
import { BellRingingIcon } from "@phosphor-icons/react/dist/csr/BellRinging"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ALERT_RESPONSES, shiftAlerts } from "@/lib/shift-alerts"
import { useApp } from "@/lib/store"

const LEVEL = { MERAH: { variant: "riskRed", label: "Merah" }, KUNING: { variant: "riskYellow", label: "Waspada" }, INFO: { variant: "kualitas", label: "Periksa" } } as const

/** Live alerts for the foreman's crew (HSE sees all): Band, drink gaps and silent Bands, each handled with a recorded action. */
export function AlertInbox() {
  const { state, user, dispatch } = useApp()
  const [now, setNow] = useState(() => Date.now())
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => typeof Notification === "undefined" ? "unsupported" : Notification.permission)
  const seen = useRef<Set<string> | null>(null)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer) }, [])
  const alerts = user ? shiftAlerts(state, user, now) : []
  const keys = alerts.map(alert => alert.key).join("|")

  // A new alert reaches the foreman on screen and, if allowed, as a system notification even when the tab is in the background.
  useEffect(() => {
    if (seen.current === null) { seen.current = new Set(alerts.map(alert => alert.key)); return }
    for (const alert of alerts) {
      if (seen.current.has(alert.key)) continue
      seen.current.add(alert.key)
      const title = `${alert.level === "MERAH" ? "🔴" : alert.level === "KUNING" ? "🟡" : "ℹ️"} ${alert.nama}`
      if (alert.level === "MERAH") toast.error(`${alert.nama}: ${alert.pesan}`)
      else toast.warning(`${alert.nama}: ${alert.pesan}`)
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(title, { body: alert.pesan, tag: alert.key })
    }
  }, [keys]) // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the alert set, not on object identity

  if (!user || !["MANDOR", "HSE"].includes(user.role)) return null
  return <section className="summon-panel mb-6" aria-labelledby="alert-inbox-title">
    <div className="panel-heading"><div><h2 id="alert-inbox-title" className="flex items-center gap-2"><BellRingingIcon aria-hidden />Peringatan {user.role === "MANDOR" ? "regu" : "lapangan"}</h2><p>{alerts.length ? `${alerts.length} perlu ditangani` : "Tidak ada peringatan aktif."}</p></div>
      {permission === "default" && <Button variant="outline" size="sm" onClick={() => void Notification.requestPermission().then(setPermission)}>Aktifkan notifikasi</Button>}</div>
    {alerts.length > 0 && <ul className="divide-y">{alerts.map(alert => <li key={alert.key} className="flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="min-w-0"><p className="flex items-center gap-2 font-medium"><Badge variant={LEVEL[alert.level].variant}>{LEVEL[alert.level].label}</Badge>{alert.nama}</p><p className="mt-1 text-sm text-muted-foreground">{alert.pesan}</p></div>
      <div className="flex flex-wrap gap-2">{alert.responses.map(response => <Button key={response} size="sm" variant={alert.level === "MERAH" ? "default" : "outline"} onClick={() => dispatch({ type: "TANGANI_PERINGATAN", key: alert.key, pekerjaKode: alert.pekerjaKode, kind: alert.kind, tindakan: response })}>{ALERT_RESPONSES[response]}</Button>)}</div>
    </li>)}</ul>}
  </section>
}

"use client"

import { InfoIcon as Info } from "@phosphor-icons/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LABEL_PERAN } from "@/lib/access"
import { useApp } from "@/lib/store"
import type { Role } from "@/lib/types"
import { USERS } from "@/lib/config"
import { Button } from "@/components/ui/button"

/** Tells the viewer which role acts on this step. Actions they may not take are disabled, and the data layer refuses them anyway. */
export function RoleHint({ peran }: { peran: Role[] }) {
  const { user, dispatch } = useApp()
  if (!user || peran.includes(user.role)) return null
  return (
    <Alert className="mb-6 bg-card">
      <Info />
      <AlertTitle>Langkah ini dikerjakan oleh {peran.map((p) => LABEL_PERAN[p]).join(" atau ")}</AlertTitle>
      <AlertDescription><p>Anda sedang mencoba peran {LABEL_PERAN[user.role]}. Untuk menjalankan langkah ini, ganti peran simulasi:</p><div className="mt-3 flex flex-wrap gap-2">{USERS.filter(u => peran.includes(u.role)).map(u => <Button key={u.id} variant="outline" onClick={() => dispatch({ type: "LOGIN", userId: u.id })}>Coba sebagai {u.nama} · {LABEL_PERAN[u.role]}</Button>)}</div></AlertDescription>
    </Alert>
  )
}

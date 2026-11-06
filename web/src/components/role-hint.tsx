"use client"

import { InfoIcon as Info } from "@phosphor-icons/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LABEL_PERAN } from "@/lib/access"
import { useApp } from "@/lib/store"
import type { Role } from "@/lib/types"

/** Tells the viewer which role acts on this step. Actions they may not take are disabled, and the data layer refuses them anyway. */
export function RoleHint({ peran }: { peran: Role[] }) {
  const { user } = useApp()
  if (!user || peran.includes(user.role)) return null
  return (
    <Alert className="mb-6 bg-card">
      <Info />
      <AlertTitle>Modul ini ditangani oleh {peran.map((p) => LABEL_PERAN[p]).join(" atau ")}</AlertTitle>
      <AlertDescription>Peran aktif Anda: {LABEL_PERAN[user.role]}. Halaman ini hanya dapat dikerjakan oleh peran yang berwenang.</AlertDescription>
    </Alert>
  )
}

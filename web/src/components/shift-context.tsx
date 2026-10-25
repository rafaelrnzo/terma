"use client"

import { usePathname } from "next/navigation"
import { LABEL_PERAN } from "@/lib/access"
import { useApp } from "@/lib/store"
import { workflow } from "@/lib/workflow"

export function StepContext() {
  const { state, user } = useApp()
  const path = usePathname()
  if (!user) return null
  const step = workflow(state, user).find(s => s.href === path)
  if (!step) return null
  return <p aria-label="Konteks langkah" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span>{step.progress}</span><span>Ditangani {step.peran.map(p => LABEL_PERAN[p]).join(" & ")}</span></p>
}

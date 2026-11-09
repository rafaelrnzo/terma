"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import WorkspaceHome from "@/components/workspace-home"
import { BandHandoff } from "@/components/band-assignment"
import { AlertInbox } from "@/components/alert-inbox"
import { useApp } from "@/lib/store"
import { roleHomePath } from "@/lib/navigation"
import type { Role } from "@/lib/types"

export function RoleHome({ role }: { role?: Role }) {
  const { user } = useApp()
  const router = useRouter()
  useEffect(() => {
    if (user && !role) router.replace(roleHomePath(user) + window.location.search)
  }, [user, role, router])
  if (user && role && role !== user.role && user.role !== "ADMIN") return <p role="alert">Tidak punya akses ke ruang kerja peran ini.</p>
  if (!user || !role) return <p role="status" className="text-sm text-muted-foreground">Membuka ruang kerja sesuai peran…</p>
  return <>{(role === "MANDOR" || role === "HSE" || role === "ADMIN") && <AlertInbox />}<WorkspaceHome />{role === "MANDOR" && <BandHandoff />}</>
}

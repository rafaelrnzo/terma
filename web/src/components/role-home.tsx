"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import WorkspaceHome from "@/components/workspace-home"
import { useApp } from "@/lib/store"
import { roleHomePath } from "@/lib/navigation"
import type { Role } from "@/lib/types"

export function RoleHome({ role }: { role?: Role }) {
  const { user } = useApp()
  const router = useRouter()
  useEffect(() => {
    if (user && role !== user.role) router.replace(roleHomePath(user) + window.location.search)
  }, [user, role, router])
  if (!user || role !== user.role) return <p role="status" className="text-sm text-muted-foreground">Membuka ruang kerja sesuai peran…</p>
  return <WorkspaceHome />
}

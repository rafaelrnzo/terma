"use client"

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise"
import { Button } from "@/components/ui/button"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"

export function CompanyConnection() {
  const { state, user, dispatch } = useApp()
  const company = managementOf(state)
  if (!user || user.role === "MANDOR") return null
  return <Button size="sm" variant="ghost" title={company.companySync ? `Referensi perusahaan lokal · diperbarui ${new Date(company.companySync.syncedAt).toLocaleString("id-ID")}` : "Referensi perusahaan lokal"} onClick={() => dispatch({ type: "SINKRON_PERUSAHAAN" })}><ArrowClockwiseIcon />Perbarui master</Button>
}

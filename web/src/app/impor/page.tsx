"use client"

import { CompanyConnection } from "@/components/company-connection"
import { PageHeader } from "@/components/app-shell"
import { WorkerDirectory } from "@/components/worker-directory"
import { RoleHint } from "@/components/role-hint"
import { useApp } from "@/lib/store"

export default function ImporPage() {
  const { state } = useApp()
  return <>
    <PageHeader title="Data pekerja" peran="Petugas data · HSE" summary="Master pekerja dan penugasan tersedia dari Data Hub perusahaan. Periksa data, lalu pilih peserta saat membuat shift." />
    <RoleHint peran={["PETUGAS_DATA", "HSE"]} />
    <CompanyConnection />
    <WorkerDirectory key={state.sesi?.userId} />

  </>
}

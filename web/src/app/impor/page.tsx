"use client"

import { CompanyConnection } from "@/components/company-connection"
import { PageHeader } from "@/components/app-shell"
import { WorkerDirectory } from "@/components/worker-directory"
import { RoleHint } from "@/components/role-hint"
import { useApp } from "@/lib/store"

export default function ImporPage() {
  const { state } = useApp()
  return <>
    <PageHeader title="Data pekerja" summary="Kelola identitas dan penugasan pekerja. Pantau dokumen pemeriksaan, kondisi saat check-in, dan tindak lanjut HSE per tanggal." />
    <RoleHint peran={["PETUGAS_DATA", "HSE", "KLINIK"]} />
    <CompanyConnection />
    <WorkerDirectory key={state.sesi?.userId} />

  </>
}

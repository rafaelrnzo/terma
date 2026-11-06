"use client"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/app-shell"
import { ModuleTabs } from "@/components/module-tabs"
import { WorkerDirectory } from "@/components/worker-directory"
import { WorkerExaminations } from "@/components/worker-examinations"
import { useApp } from "@/lib/store"

export function WorkerDataWorkspace() {
  const query = useSearchParams()
  const tab = query.get("tab") === "pemeriksaan" ? "pemeriksaan" : "direktori"
  const workerCode = query.get("pekerja") ?? undefined
  const date = query.get("tanggal") ?? undefined
  const { user } = useApp()
  return <><PageHeader title="Data pekerja" /><ModuleTabs label="Data pekerja" active={tab} tabs={[{key:"direktori",label:"Direktori",href:"/impor"},{key:"pemeriksaan",label:"Pemeriksaan awal",href:"/impor?tab=pemeriksaan"}]} /><div className="module-panel" key={tab}>{tab === "pemeriksaan" ? <WorkerExaminations key={workerCode} workerCode={workerCode} /> : <WorkerDirectory key={user?.id} initialDate={date} />}</div></>
}

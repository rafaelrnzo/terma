"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { RouteLoading } from "@/components/route-loading"
import { PageHeader } from "@/components/app-shell"
import { ModuleTabs } from "@/components/module-tabs"
import { AdaptationWorklist } from "@/components/adaptation-worklist"
import { ShiftPlanReview } from "@/components/shift-plan-review"
function PlanningContent() {
  const tab = useSearchParams().get("tab")
  const adaptation = tab === "adaptasi"
  return <><PageHeader title="Perencanaan shift" /><ModuleTabs label="Perencanaan shift" active={adaptation ? "adaptasi" : "rencana"} tabs={[{key:"adaptasi",label:"Adaptasi pekerja",href:"/rencana?tab=adaptasi"},{key:"rencana",label:"Rencana & persetujuan",href:"/rencana"}]} /><div className="module-panel" key={adaptation ? "adaptasi" : "rencana"}>{adaptation ? <AdaptationWorklist /> : <section className="summon-panel p-5"><ShiftPlanReview /></section>}</div></>
}

export default function PlanningPage() { return <Suspense fallback={<RouteLoading />}><PlanningContent /></Suspense> }

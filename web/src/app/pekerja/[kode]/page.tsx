import { Suspense } from "react"
import { RouteLoading } from "@/components/route-loading"
import { WorkerPlanPage } from "@/components/worker-plan-page"
export default function WorkerPage() { return <Suspense fallback={<RouteLoading />}><WorkerPlanPage /></Suspense> }

import { Suspense } from "react"
import { RouteLoading } from "@/components/route-loading"
import { MonitoringWorkspace } from "@/components/monitoring-workspace"
export default function MonitoringPage() { return <Suspense fallback={<RouteLoading />}><MonitoringWorkspace /></Suspense> }

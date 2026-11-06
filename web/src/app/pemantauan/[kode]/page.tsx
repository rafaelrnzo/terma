import { Suspense } from "react"
import { RouteLoading } from "@/components/route-loading"
import { WorkerMonitoringRoute } from "@/components/worker-monitoring-page"
export default function MonitoringDetail() { return <Suspense fallback={<RouteLoading />}><WorkerMonitoringRoute /></Suspense> }

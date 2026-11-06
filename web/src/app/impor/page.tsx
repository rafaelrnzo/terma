import { Suspense } from "react"
import { RouteLoading } from "@/components/route-loading"
import { WorkerDataWorkspace } from "@/components/worker-data-workspace"
export default function WorkersPage() { return <Suspense fallback={<RouteLoading />}><WorkerDataWorkspace /></Suspense> }

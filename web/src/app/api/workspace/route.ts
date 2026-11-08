import { NextResponse } from "next/server"
import { userFromRequest } from "@/lib/server/auth"
import { ensureIotBridge } from "@/lib/server/iot-bridge"
import { ensureMorningJob } from "@/lib/server/morning-draft"
import { projectFor } from "@/lib/server/projection"
import { workspace } from "@/lib/server/workspace-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** The shared workspace as the signed-in user may see it. */
export function GET(request: Request) {
  const user = userFromRequest(request)
  if (!user) return NextResponse.json({ error: "Masuk terlebih dahulu." }, { status: 401 })
  ensureIotBridge()
  ensureMorningJob()
  const { state, version } = workspace()
  return NextResponse.json({ version, state: projectFor(state, user) }, { headers: { "Cache-Control": "no-store" } })
}

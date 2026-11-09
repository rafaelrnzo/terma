import { NextResponse } from "next/server"
import { userFromRequest } from "@/lib/server/auth"
import { projectFor } from "@/lib/server/projection"
import { applyAction, employeeActionAllowed, workspace } from "@/lib/server/workspace-store"
import type { Action } from "@/lib/store-state"

export const runtime = "nodejs"

/** Applies one action as the signed-in user; the reducer's role checks run here, on the server. */
export async function POST(request: Request) {
  const user = userFromRequest(request)
  if (!user) return NextResponse.json({ error: "Sesi berakhir. Masuk kembali." }, { status: 401 })
  const body = await request.json().catch(() => null) as { action?: unknown } | null
  const action = body?.action
  if (!action || typeof action !== "object" || typeof (action as { type?: unknown }).type !== "string") return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 })
  if (!employeeActionAllowed(user, action as Action)) return NextResponse.json({ error: "Pegawai hanya dapat mencatat absensinya sendiri." }, { status: 403 })
  try {
    // SAFETY: the reducer validates every field of the action it understands and ignores unknown types.
    const { notice, version } = applyAction(user, action as Action)
    return NextResponse.json({ version, notice, state: projectFor(workspace().state, user) })
  } catch {
    return NextResponse.json({ error: "Aksi tidak dapat diproses." }, { status: 400 })
  }
}

import { NextResponse } from "next/server"
import { clearedSessionCookie } from "@/lib/server/auth"

export const runtime = "nodejs"

export function POST() {
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearedSessionCookie } })
}

import { NextResponse } from "next/server"
import { authenticate, sessionCookie, sessionToken } from "@/lib/server/auth"

export const runtime = "nodejs"

// ponytail: per-process failure counter; move to the shared store if several web instances run.
const failures = new Map<string, { count: number; until: number }>()
const LIMIT = 8, WINDOW_MS = 10 * 60_000

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  const record = failures.get(ip)
  if (record && record.count >= LIMIT && record.until > Date.now()) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." }, { status: 429 })
  const body = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null
  const user = typeof body?.username === "string" && typeof body.password === "string" ? authenticate(body.username, body.password) : null
  if (!user) {
    failures.set(ip, { count: (record && record.until > Date.now() ? record.count : 0) + 1, until: Date.now() + WINDOW_MS })
    return NextResponse.json({ error: "Nama pengguna atau kata sandi salah." }, { status: 401 })
  }
  failures.delete(ip)
  return NextResponse.json({ user: { id: user.id, nama: user.nama, role: user.role } }, { headers: { "Set-Cookie": sessionCookie(sessionToken(user), request) } })
}

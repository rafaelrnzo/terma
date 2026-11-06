import { NextResponse } from "next/server"
import { BMKG_URL, parseBmkgForecast } from "@/lib/bmkg"

export const maxDuration = 20

export async function GET() {
  try {
    const response = await fetch(BMKG_URL, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12000) })
    if (!response.ok) throw new Error(`BMKG HTTP ${response.status}`)
    const raw: unknown = await response.json()
    parseBmkgForecast(raw)
    return NextResponse.json(raw, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
  } catch {
    return NextResponse.json({ error: "Prakiraan BMKG belum dapat diperbarui. Coba lagi beberapa saat." }, { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}

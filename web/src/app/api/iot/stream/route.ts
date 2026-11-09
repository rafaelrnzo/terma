import { userFromRequest } from "@/lib/server/auth"
import { iotKey, iotUrl, readEvents } from "@/lib/server/iot-bridge"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Live device events for signed-in screens; raw Band values only reach Klinik. */
export async function GET(request: Request) {
  const user = userFromRequest(request)
  if (!user) return new Response("Masuk terlebih dahulu.", { status: 401 })
  const after = new URL(request.url).searchParams.get("after") ?? "0"
  const upstream = await fetch(`${iotUrl()}/api/iot/stream?after=${encodeURIComponent(after)}`, { headers: { "x-terma-key": iotKey() }, signal: request.signal }).catch(() => null)
  if (!upstream?.ok || !upstream.body) return new Response("Server IoT tidak terhubung.", { status: 502 })
  const body = upstream.body
  const encoder = new TextEncoder()
  const clinic = user.role === "KLINIK"
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"))
      void readEvents(body, event => {
        const visible = event.type === "band" && !clinic ? { ...event, heartRate: null, skinC: null, spo2: null } : event
        controller.enqueue(encoder.encode(`id: ${event.seq}\ndata: ${JSON.stringify(visible)}\n\n`))
      }, comment => controller.enqueue(encoder.encode(`${comment}\n\n`)))
        .catch(() => { /* upstream or browser closed */ }).finally(() => {
          try { controller.close() } catch { /* already closed */ }
        })
    },
  })
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } })
}

import { userFromRequest } from "@/lib/server/auth"
import { onWorkspaceChange, workspace } from "@/lib/server/workspace-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Tells every open screen when the shared workspace changed; screens then refetch their own view. */
export function GET(request: Request) {
  if (!userFromRequest(request)) return new Response("Masuk terlebih dahulu.", { status: 401 })
  const encoder = new TextEncoder()
  let stop = () => {}
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => { try { controller.enqueue(encoder.encode(text)) } catch { stop() } }
      send(`data: ${workspace().version}\n\n`)
      const off = onWorkspaceChange(version => send(`data: ${version}\n\n`))
      const ping = setInterval(() => send(": ping\n\n"), 15000)
      stop = () => { off(); clearInterval(ping) }
      request.signal.addEventListener("abort", () => { stop(); try { controller.close() } catch { /* already closed */ } })
    },
    cancel() { stop() },
  })
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } })
}

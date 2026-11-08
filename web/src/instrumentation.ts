/** Server start: begin filing device data and the 05.30 draft job without waiting for a visitor. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { ensureIotBridge } = await import("./lib/server/iot-bridge")
  const { ensureMorningJob } = await import("./lib/server/morning-draft")
  ensureIotBridge()
  ensureMorningJob()
}

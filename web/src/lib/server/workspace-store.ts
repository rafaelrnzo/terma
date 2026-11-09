import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ensureManagement } from "../management-state"
import { reducer } from "../store-reducer"
import type { Action, AppState } from "../store-state"
import type { User } from "../types"
import { emptyWorkspaceState, readDemoState } from "../workspace-document"
import { dataDir } from "./data-dir"

/** Browser-side actions that only touch the viewer's own screen; the server never applies them. */
const CLIENT_ONLY = new Set<Action["type"]>(["LOGIN", "HYDRATE", "CUACA_MULAI", "CUACA_GAGAL"])

/** Worker accounts may change only their own attendance, regardless of the client payload. */
export function employeeActionAllowed(actor: User, action: Action) {
  return actor.role !== "PEGAWAI" || ((action.type === "CATAT_CHECKIN" || action.type === "CATAT_PULANG" || action.type === "RESET_ABSEN_MASUK" || action.type === "RESET_ABSEN_PULANG") && action.pekerjaKode === actor.pekerjaKode)
}

/**
 * The file is the single source of truth. Route bundles may not share module memory, so every read
 * and write checks the file's modification time; its value doubles as the workspace version.
 */
const file = () => join(dataDir(), "workspace.json")
const modified = () => { try { return statSync(file()).mtimeMs } catch { return 0 } }
let cache: { state: AppState; version: number } | undefined

function persist(next: AppState) {
  mkdirSync(dataDir(), { recursive: true })
  writeFileSync(`${file()}.tmp`, JSON.stringify(next))
  renameSync(`${file()}.tmp`, file())
  cache = { state: next, version: modified() }
}

function current() {
  const version = modified()
  if (cache && cache.version === version && version !== 0) return cache
  if (version === 0) {
    // A missing file starts a new site; an unreadable one must not be silently replaced (readDemoState throws).
    persist({ ...reducer(emptyWorkspaceState(), { type: "SINKRON_PERUSAHAAN" }), notice: undefined })
    return cache!
  }
  cache = { state: { ...ensureManagement(readDemoState(readFileSync(file(), "utf8"))), notice: undefined }, version }
  return cache
}

const shared = (s: AppState) => JSON.stringify({ ...s, sesi: undefined, notice: undefined, weather: undefined })

/**
 * Runs one action as `actor` (or as the system for device data) against the shared workspace.
 * Permission checks inside the reducer use the real user. Read-modify-write is synchronous, so
 * actions inside this process never interleave.
 * ponytail: one web process per data directory; move to Postgres before running several instances.
 */
export function applyAction(actor: User | null, action: Action): { notice?: AppState["notice"]; version: number } {
  const now = current()
  if (actor && !employeeActionAllowed(actor, action)) return { notice: { id: Date.now(), tipe: "error", pesan: "Pegawai hanya dapat mencatat absensinya sendiri." }, version: now.version }
  if (CLIENT_ONLY.has(action.type)) return { version: now.version }
  const before = actor ? { ...now.state, sesi: { userId: actor.id, masuk: new Date().toISOString() } } : now.state
  const after = reducer(before, action)
  const next = { ...after, notice: undefined, weather: undefined }
  if (shared(next) !== shared(now.state)) persist(next)
  return { notice: after.notice, version: current().version }
}

/** Device data arrives without a person; TERIMA_IOT checks no role and only adds telemetry. */
export const applySystemAction = (action: Extract<Action, { type: "TERIMA_IOT" }>) => applyAction(null, action)

export function workspace() { const now = current(); return { state: now.state, version: now.version } }

/** Calls `listener` whenever the workspace file changes, whoever wrote it. */
export function onWorkspaceChange(listener: (version: number) => void) {
  let last = modified()
  const timer = setInterval(() => {
    const version = modified()
    if (version !== last) { last = version; listener(version) }
  }, 1000)
  return () => clearInterval(timer)
}

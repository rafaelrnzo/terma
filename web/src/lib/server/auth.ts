import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { SYSTEM_USER_ID, USERS } from "../config"
import type { User } from "../types"
import { dataDir } from "./data-dir"

/** Password hashes per username (written by scripts/set-password.mjs), kept outside the workspace document. */
const usersFile = () => join(dataDir(), "users.json")
const SESSION_HOURS = 12
export const SESSION_COOKIE = "terma_session"

function readHashes(): Record<string, string> {
  try { return JSON.parse(readFileSync(usersFile(), "utf8")) as Record<string, string> } catch { return {} }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function authenticate(username: string, password: string): User | null {
  const user = USERS.find(row => row.username === username.trim().toLowerCase() && row.id !== SYSTEM_USER_ID)
  const stored = user ? readHashes()[user.username] : undefined
  // ponytail: still hash on unknown users so response time does not reveal which usernames exist
  const ok = verifyPassword(password, stored ?? `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`)
  return user && stored && ok ? user : null
}

function secret() {
  const configured = process.env.TERMA_SESSION_SECRET
  if (configured && configured.length >= 32) return configured
  if (process.env.NODE_ENV === "production") throw new Error("TERMA_SESSION_SECRET (≥32 karakter) wajib diatur di production")
  // Dev: one secret per data directory, shared by every route bundle and kept across restarts.
  const file = join(dataDir(), "session-secret")
  try { return readFileSync(file, "utf8").trim() } catch {
    mkdirSync(dataDir(), { recursive: true })
    try { writeFileSync(file, randomBytes(32).toString("hex"), { mode: 0o600, flag: "wx" }) }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error } // another route created it first
    return readFileSync(file, "utf8").trim()
  }
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url")

export function sessionToken(user: User, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ u: user.id, e: now + SESSION_HOURS * 3600_000 })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function userFromToken(token: string | undefined, now = Date.now()): User | null {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const { u, e } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u: string; e: number }
    return typeof e === "number" && e > now && u !== SYSTEM_USER_ID ? USERS.find(user => user.id === u) ?? null : null
  } catch { return null }
}

export function userFromRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? ""
  const token = cookie.split(";").map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1)
  return userFromToken(token)
}

export function sessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : ""
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}${secure}`
}
export const clearedSessionCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`

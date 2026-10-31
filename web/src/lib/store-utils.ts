import { USERS } from "./config"
import type { AppState } from "./store-state"
import type { User } from "./types"

let noticeSeq = 0
export const now = () => new Date().toISOString()
export const userById = (id?: string): User | null => USERS.find((u) => u.id === id) ?? null
export const aktor = (s: AppState) => userById(s.sesi?.userId)

export function audit(s: AppState, aksi: string, detail: string, nama?: string): AppState {
  return { ...s, audit: [{ waktu: now(), aktor: nama ?? aktor(s)?.nama ?? "Belum tersedia", aksi, detail: s.demo && s.demo.versi !== "workspace-v3" ? `[DATA CONTOH] ${detail}` : detail }, ...s.audit] }
}
export function notice(s: AppState, tipe: "ok" | "error" | "info", pesan: string): AppState {
  return { ...s, notice: { id: ++noticeSeq, tipe, pesan } }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
export function tanggalValid(s: string) {
  if (!ISO.test(s)) return false
  const d = new Date(s + "T00:00:00Z")
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
export const angka = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")))

"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wordmark } from "@/components/wordmark"
import { useApp } from "@/lib/store"

/** Sign-in for every operational screen, the kiosk tablet included. */
export function LoginScreen() {
  const { signedIn } = useApp()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }).catch(() => null)
    setBusy(false)
    if (response?.ok) { setPassword(""); signedIn(); return }
    // SAFETY: /api/auth/login answers errors as { error: string }.
    const body = response ? await response.json().catch(() => null) as { error?: string } | null : null
    setError(body?.error ?? "Server TERMA belum dapat dihubungi.")
  }
  return <main className="grid min-h-dvh place-items-center bg-background p-6">
    <form onSubmit={submit} className="summon-panel w-full max-w-sm space-y-5 p-6" aria-labelledby="login-title">
      <Wordmark />
      <div><h1 id="login-title" className="font-heading text-xl font-semibold">Masuk ke TERMA</h1><p className="mt-1 text-sm text-muted-foreground">Gunakan akun yang diberikan admin lokasi.</p></div>
      <div className="space-y-2"><Label htmlFor="login-user">Nama pengguna</Label><Input id="login-user" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required autoFocus /></div>
      <div className="space-y-2"><Label htmlFor="login-password">Kata sandi</Label><Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</Button>
    </form>
  </main>
}

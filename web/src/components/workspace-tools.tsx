"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight, Bell, CircleHelp, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useApp } from "@/lib/store"
import { attentionItems, searchWorkspace, tanggalLabel } from "@/lib/workspace"

export function WorkspaceTools() {
  const { state, user } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
  const [attentionOpen, setAttentionOpen] = useState(false)
  const [query, setQuery] = useState("")
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(open => !open) }
    }
    document.addEventListener("keydown", keydown)
    return () => document.removeEventListener("keydown", keydown)
  }, [])
  if (!user) return null
  const results = searchWorkspace(state, user, query)
  const attention = attentionItems(state, user)
  return <div className="flex items-center gap-1">
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogTrigger asChild><Button variant="secondary" size="icon" aria-label="Cari halaman atau pekerja" title="Cari (⌘ / Ctrl K)"><Search /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Cari di ruang kerja</DialogTitle><DialogDescription>Temukan halaman atau pekerja dalam lingkup peran Anda.</DialogDescription></DialogHeader>
        <label htmlFor="workspace-search" className="sr-only">Kata pencarian</label>
        <Input id="workspace-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama, ID pekerja, atau halaman…" />
        <p className="text-xs text-muted-foreground" role="status">{results.length} hasil</p>
        <div className="max-h-80 overflow-y-auto">
          {results.map(result => <Link key={result.href} href={result.href} onClick={() => setSearchOpen(false)} className="flex items-center justify-between gap-4 rounded-md p-3 hover:bg-muted"><span><span className="block font-medium">{result.label}</span><span className="mt-1 block text-xs text-muted-foreground">{result.kind} · {result.detail}</span></span><ArrowUpRight className="size-4 shrink-0" aria-hidden /></Link>)}
          {!results.length && <div className="py-6"><p>Tidak ada hasil untuk “{query}”.</p><Button className="mt-3" variant="outline" onClick={() => setQuery("")}>Hapus pencarian</Button></div>}
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={attentionOpen} onOpenChange={setAttentionOpen}>
      <DialogTrigger asChild><Button variant="secondary" className="relative" size="icon" aria-label={`Pusat perhatian: ${attention.length} langkah belum lengkap`}><Bell />{attention.length > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{attention.length}</span>}</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Perlu perhatian Anda</DialogTitle><DialogDescription>{tanggalLabel(state.tanggal)} · Prioritas {user.nama}. Ini ringkasan data lokal, bukan notifikasi langsung dari lapangan.</DialogDescription></DialogHeader>
        <div className="divide-y">{attention.map(item => <Link key={item.href} href={item.href} onClick={() => setAttentionOpen(false)} className="flex items-center justify-between gap-4 rounded-sm py-4 hover:bg-muted"><span><span className="block font-medium">{item.label}</span><span className="mt-1 block text-sm text-muted-foreground">{item.progress}</span></span><ArrowUpRight className="size-4 shrink-0" aria-hidden /></Link>)}</div>
        {!attention.length && <p className="py-4 text-muted-foreground">Tidak ada langkah tertunda untuk peran ini. Anda tetap dapat meninjau laporan shift.</p>}
        <Button asChild variant="outline"><Link href="/laporan" onClick={() => setAttentionOpen(false)}>Buka laporan shift</Link></Button>
      </DialogContent>
    </Dialog>
    <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex"><Link href="/panduan" aria-label="Panduan aplikasi"><CircleHelp /></Link></Button>
  </div>
}

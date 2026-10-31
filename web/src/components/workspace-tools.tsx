"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRightIcon as ArrowUpRight, MagnifyingGlassIcon as Search } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useApp } from "@/lib/store"
import { searchWorkspace } from "@/lib/workspace"

export function WorkspaceTools() {
  const { state, user } = useApp()
  const [searchOpen, setSearchOpen] = useState(false)
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
    <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/panduan">Panduan</Link></Button>
  </div>
}

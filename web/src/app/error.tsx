"use client"
import { Button } from "@/components/ui/button"
export default function PageError({ reset }: { reset: () => void }) {
  return <section className="summon-panel space-y-4 p-6" role="alert"><h1 className="text-xl font-semibold">Halaman belum dapat dibuka</h1><p className="text-sm text-muted-foreground">Coba muat halaman ini kembali.</p><Button onClick={reset}>Coba lagi</Button></section>
}

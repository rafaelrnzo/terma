"use client"

import { DatabaseIcon as Database } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { bisaMuatDemo } from "@/lib/seed-data"
import { useApp, useIzin } from "@/lib/store"

export function DemoSeed() {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  if (state.demo) return null
  const kosong = bisaMuatDemo(state)
  return (
    <Card aria-label="Data demo" className="no-print mb-6 border-dashed bg-transparent">
      <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-prose">
        <h2 className="text-sm font-semibold">Coba dengan data demo</h2>
        <p id="demo-keterangan" className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {kosong ? `Isi tanggal ${state.tanggal} dengan 8 pekerja fiktif, WBGT replay, rencana, dan simulasi tindak lanjut. Bukan untuk operasi nyata.` : "Ruang kerja sudah berisi data. Untuk mencoba seed tanpa menimpanya, buka aplikasi di jendela privat baru."}
          {!izin("MUAT_DEMO") && " Pilih pengguna HSE (Ratna) untuk memuat demo."}
        </p>
      </div>
      <Button variant="outline" className="shrink-0" disabled={!kosong || !izin("MUAT_DEMO")} aria-describedby="demo-keterangan" onClick={() => dispatch({ type: "MUAT_DEMO" })}>
        <Database aria-hidden /> Muat data demo
      </Button>
      </CardContent>
    </Card>
  )
}

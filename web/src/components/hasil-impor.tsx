import { Stat } from "@/components/stat"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ImportResult } from "@/lib/types"

export function HasilImpor({ log }: { log?: ImportResult }) {
  if (!log) return null
  return (
    <section className="space-y-4 border-t pt-5" aria-label="Hasil validasi">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Hasil validasi</h3>
        <p className="text-xs text-muted-foreground">{new Date(log.waktu).toLocaleTimeString("id-ID")}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Baris diterima" value={log.diterima} />
        <Stat label="Catatan baru" value={log.baru} />
        <Stat label="Sudah ada (tidak digandakan)" value={log.sudahAda} />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Ditolak: {log.ditolak.length} baris</div>
        {log.ditolak.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Baris</TableHead>
                <TableHead>Alasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.ditolak.map((d) => (
                <TableRow key={d.baris}>
                  <TableCell className="font-mono text-xs">{d.baris}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="text-destructive">{d.alasan}</div>
                    <div className="mt-1 max-w-prose whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">{d.data}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  )
}

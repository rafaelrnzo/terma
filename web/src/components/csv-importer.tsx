"use client"

import { useRef, useState } from "react"
import { DownloadSimpleIcon as Download, UploadSimpleIcon as Upload } from "@phosphor-icons/react"
import { HasilImpor } from "@/components/hasil-impor"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { unduhCsv } from "@/lib/templates"
import type { ImportResult } from "@/lib/types"

const MAX_BYTES = 2 * 1024 * 1024

export function CsvImporter({
  id,
  title,
  description,
  template,
  disabled,
  disabledReason,
  onImport,
  result,
}: {
  id: string
  title: string
  description: string
  template: { file: string; isi: string }
  disabled?: boolean
  disabledReason?: string
  onImport: (csv: string, source: string) => void
  result?: ImportResult
}) {
  const [isi, setIsi] = useState("")
  const [namaBerkas, setNamaBerkas] = useState("")
  const [galat, setGalat] = useState("")
  const [reading, setReading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Pilih berkas atau tempel data CSV, lalu periksa hasil validasinya.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            id={`${id}-file`}
            type="file"
            accept=".csv,text/csv"
            hidden
            tabIndex={-1}
            aria-label={`Berkas CSV untuk ${title}`}
            disabled={disabled}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (!f) return
              if (f.size > MAX_BYTES) return setGalat("Berkas lebih dari 2 MB.")
              setGalat("")
              setReading(true)
              setSubmitted(false)
              try {
                const text = await f.text()
                setNamaBerkas(f.name)
                setIsi(text)
              } catch {
                setGalat("Berkas tidak dapat dibaca. Pilih ulang berkas CSV atau tempel isinya di bawah.")
              } finally {
                setReading(false)
              }
            }}
          />
          <Button variant="outline" disabled={disabled || reading} onClick={() => fileRef.current?.click()}>
            <Upload /> {reading ? "Membaca berkas…" : "Pilih berkas CSV"}
          </Button>
          <Button variant="ghost" onClick={() => unduhCsv(template.file, template.isi)}>
            <Download /> Unduh templat
          </Button>
          {namaBerkas && <span className="text-xs text-muted-foreground">{namaBerkas}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-isi`}>Isi CSV</Label>
          <Textarea
            id={`${id}-isi`}
            value={isi}
            disabled={disabled}
            aria-describedby={`${id}-feedback`}
            onChange={(e) => {
              setIsi(e.target.value)
              setNamaBerkas("")
              setSubmitted(false)
            }}
            placeholder={template.isi.split("\n")[0]}
            className="h-36 resize-y bg-background/60 font-mono text-base leading-relaxed md:text-sm"
          />
        </div>
        <div id={`${id}-feedback`} aria-live="polite" className="text-sm leading-relaxed">
          {galat ? <p className="text-destructive">{galat}</p> : submitted && result ? (
            <p className={result.ditolak.length ? "text-destructive" : "text-primary"}>
              {result.diterima} baris diterima; {result.ditolak.length} ditolak.
              {result.ditolak.length ? " Perbaiki isian di atas lalu impor ulang. Baris yang sudah tersimpan tidak digandakan." : " Isian dipertahankan agar dapat Anda periksa kembali."}
            </p>
          ) : <p className="text-muted-foreground">Maksimal 2 MB. Isian tetap tersedia setelah impor untuk diperiksa atau diperbaiki.</p>}
        </div>
        {disabled && disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
        <div className="flex flex-wrap gap-2"><Button
          disabled={disabled || reading || !isi.trim()}
          onClick={() => {
            onImport(isi, namaBerkas || "tempel manual")
            setSubmitted(true)
          }}
        >
          <Upload /> Impor
        </Button>
        {isi && <Button variant="ghost" disabled={disabled || reading} onClick={() => { setIsi(""); setNamaBerkas(""); setGalat(""); setSubmitted(false) }}>Kosongkan isian</Button>}
        </div>
        <Accordion type="single" collapsible className="border-t">
          <AccordionItem value="format">
            <AccordionTrigger className="text-muted-foreground">Format & ketentuan CSV</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{description}</AccordionContent>
          </AccordionItem>
        </Accordion>
        <HasilImpor log={result} />
      </CardContent>
    </Card>
  )
}

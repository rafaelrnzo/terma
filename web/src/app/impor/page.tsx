"use client"

import { PageHeader } from "@/components/app-shell"
import { CsvImporter } from "@/components/csv-importer"
import { WorkerDirectory } from "@/components/worker-directory"
import { RoleHint } from "@/components/role-hint"
import { useApp, useIzin } from "@/lib/store"
import { TEMPLATE } from "@/lib/templates"

export default function ImporPage() {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  return <>
    <PageHeader title="Data pekerja" peran="Petugas data · HSE" summary="Langkah pertama: tambahkan pekerja beserta penugasan awal. Setelah tersimpan, pilih mereka saat membuat shift." />
    <RoleHint peran={["PETUGAS_DATA", "HSE"]} />
    <WorkerDirectory key={state.sesi?.userId} />
    <details id="impor-data" className="summon-panel p-5"><summary className="cursor-pointer text-sm font-medium">Impor banyak pekerja melalui CSV (opsional)</summary><p className="my-4 text-sm text-muted-foreground">Gunakan formulir untuk satu pekerja, atau CSV untuk menambahkan banyak pekerja. Impor memperbarui master dan tidak mengubah peserta pada shift yang sudah dibuat.</p><CsvImporter id="pekerja" title="Impor master pekerja" description="Kolom: kode_pekerja, nama, regu, tanggal_mulai, tugas, zona, apd." template={TEMPLATE.pekerja} result={state.imporLog.find(log => log.jenis === "pekerja")} disabled={!izin("KELOLA_PEKERJA")} onImport={(csv, source) => dispatch({ type: "IMPOR_PEKERJA", csv, source })} /></details>
  </>
}

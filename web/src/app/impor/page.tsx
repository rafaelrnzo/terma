"use client"

import { NextStep, PageHeader } from "@/components/app-shell"
import { CsvImporter } from "@/components/csv-importer"
import { WorkerDirectory } from "@/components/worker-directory"
import { RoleHint } from "@/components/role-hint"
import { useApp, useIzin } from "@/lib/store"
import { TEMPLATE } from "@/lib/templates"

export default function ImporPage() {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const bolehImpor = izin("IMPOR")
  return <>
    <PageHeader no="1" title="Pekerja & data" peran="Petugas data · HSE" summary="Kenali pekerja, regu, dan penugasannya sebelum menyusun rencana kerja shift.">
      Buka profil pekerja untuk menelusuri riwayat dan rencana. Gunakan bagian impor untuk memperbarui data pekerja serta kehadiran. Baris tidak valid ditolak dengan alasan; impor ulang tidak menggandakan catatan.
    </PageHeader>
    <RoleHint peran={["PETUGAS_DATA", "HSE"]} />
    <WorkerDirectory key={state.sesi?.userId} />
    <section id="impor-data" className="scroll-mt-6">
      <h2 className="font-heading text-xl font-semibold">Kelola data simulasi</h2>
      <p className="mt-2 mb-5 max-w-prose text-sm leading-relaxed text-muted-foreground">Gunakan data fiktif saja. Impor pekerja terlebih dahulu, kemudian riwayat kehadiran. Perubahan dapat memicu perhitungan ulang dan persetujuan ulang rencana.</p>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <CsvImporter id="pekerja" title="Pekerja & penugasan" description="Kolom: kode_pekerja, nama, regu, tanggal_mulai, tugas, zona, apd. Kode regu, tugas, dan zona harus sesuai konfigurasi lokasi." template={TEMPLATE.pekerja} result={state.imporLog.find(l => l.jenis === "pekerja")} disabled={!bolehImpor} onImport={(csv, source) => dispatch({ type: "IMPOR_PEKERJA", csv, source })} />
        <CsvImporter id="kehadiran" title="Riwayat kehadiran" description="Kolom: kode_pekerja, tanggal, status (HADIR, CUTI, SAKIT, ALFA). Sertakan 14 hari terakhir. Kehadiran bukan bukti paparan sepanjang shift." template={TEMPLATE.kehadiran} result={state.imporLog.find(l => l.jenis === "kehadiran")} disabled={!bolehImpor || !state.pekerja.length} disabledReason={!state.pekerja.length ? "Impor pekerja terlebih dahulu." : undefined} onImport={(csv, source) => dispatch({ type: "IMPOR_KEHADIRAN", csv, source })} />
      </div>
    </section>
    <NextStep href="/paparan" label="Riwayat paparan & adaptasi" />
  </>
}

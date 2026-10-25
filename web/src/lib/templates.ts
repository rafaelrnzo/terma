// CSV templates offered for download on the import pages. Header row plus one example row.

export const TEMPLATE = {
  pekerja: {
    file: "templat-pekerja.csv",
    isi: "kode_pekerja,nama,regu,tanggal_mulai,tugas,zona,apd\nW001,Nama Pekerja,COR,2026-01-15,PEMBESIAN,COR_B,Standar\n",
  },
  kehadiran: {
    file: "templat-kehadiran.csv",
    isi: "kode_pekerja,tanggal,status\nW001,2026-01-15,HADIR\n",
  },
  pengukuran: {
    file: "templat-pengukuran-wbgt.csv",
    isi: "zona,tanggal,jam_mulai,isbb,id_alat,pencatat,kalibrasi,jenis,waktu_catat\nCOR_B,2026-01-15,8,27.2,WBGT-01,Nama Pencatat,Sertifikat 2026-01,TERUKUR,2026-01-15T08:05:00\n",
  },
  prakiraan: {
    file: "templat-prakiraan-bmkg.csv",
    isi: "tanggal,lokasi,jam_mulai,interval_jam,suhu,kelembapan,waktu_produksi\n2026-01-15,Kec. Contoh,7,3,31,70,2026-01-15T05:00:00\n",
  },
} as const

export function unduhCsv(nama: string, isi: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
}

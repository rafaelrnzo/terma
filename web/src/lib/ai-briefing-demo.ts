export type BriefingKind = "prioritas" | "absensi" | "panas" | "bantuan"

export const DEMO_PROMPTS = [
  { kind: "prioritas", label: "Apa prioritas shift pagi ini?" },
  { kind: "absensi", label: "Bagaimana status absensi?" },
  { kind: "panas", label: "Apa yang perlu dicek dari bacaan panas?" },
] as const

export const DEMO_EVIDENCE = [
  { label: "Bacaan WBGT", value: "29,1 °C", detail: "Zona Barat · 09.20", tone: "warm" },
  { label: "Absensi", value: "Raya", detail: "Belum tercatat masuk", tone: "quiet" },
  { label: "Rencana shift", value: "Menunggu", detail: "Pemeriksaan HSE", tone: "quiet" },
] as const

export const DEMO_BRIEFINGS: Record<BriefingKind, {
  title: string
  summary: string
  points: { label: string; text: string; source: string }[]
}> = {
  prioritas: {
    title: "Prioritas shift pagi",
    summary: "Mulai dari bacaan panas di Zona Barat, lalu pastikan kehadiran dan rencana shift selaras sebelum pekerjaan berjalan.",
    points: [
      { label: "Tinjau bacaan", text: "WBGT contoh mencapai 29,1 °C pada 09.20, naik dari 27,9 °C pada 07.00. Cocokkan dengan pengukuran terbaru di lokasi.", source: "Bacaan WBGT demo" },
      { label: "Konfirmasi kehadiran", text: "Raya belum memiliki catatan absen masuk pada skenario ini. Pastikan statusnya sebelum menghitung peserta shift.", source: "Absensi demo" },
      { label: "Periksa rencana", text: "Rencana masih menunggu pemeriksaan HSE. Tinjau penugasan dan kondisi lapangan sebelum memberi persetujuan.", source: "Rencana shift demo" },
    ],
  },
  absensi: {
    title: "Status absensi shift",
    summary: "Pada skenario contoh, satu pekerja dijadwalkan dan absensi masuknya belum tercatat.",
    points: [
      { label: "Pekerja terjadwal", text: "Raya tercantum pada shift pagi. Identitas ini hanya bagian dari skenario demo.", source: "Jadwal demo" },
      { label: "Belum absen", text: "Belum ada waktu masuk untuk Raya dalam cuplikan absensi contoh. Konfirmasi kehadiran melalui alur absensi sebelum menutup daftar hadir.", source: "Absensi demo" },
      { label: "Langkah berikut", text: "Jika pekerja tidak hadir, perbarui penugasan di rencana shift agar jumlah peserta tetap tepat.", source: "Rencana shift demo" },
    ],
  },
  panas: {
    title: "Bacaan panas yang perlu dicek",
    summary: "Bacaan contoh di Zona Barat meningkat dalam dua jam. Periksa pengukuran terbaru dan kesesuaian rencana kerja di area tersebut.",
    points: [
      { label: "Perubahan bacaan", text: "WBGT contoh berubah dari 27,9 °C pada 07.00 menjadi 29,1 °C pada 09.20.", source: "Bacaan WBGT demo" },
      { label: "Validasi lapangan", text: "Pastikan perangkat dan lokasi pengukuran sesuai sebelum menggunakan angka tersebut untuk meninjau shift.", source: "Perangkat demo" },
      { label: "Tinjau rencana", text: "Cocokkan kondisi terbaru dengan penugasan dan keputusan HSE yang berlaku.", source: "Rencana shift demo" },
    ],
  },
  bantuan: {
    title: "Pertanyaan ini belum tersedia di demo",
    summary: "Mode demo memakai jawaban contoh dan belum menganalisis pertanyaan bebas. Coba salah satu pertanyaan yang tersedia untuk melihat alur briefing.",
    points: [],
  },
}

export function briefingKindFor(question: string): BriefingKind {
  const text = question.toLocaleLowerCase("id-ID")
  if (/absen|hadir|pekerja|raya/.test(text)) return "absensi"
  if (/panas|wbgt|isbb|suhu|zona|sensor|bacaan|cuaca/.test(text)) return "panas"
  if (/prioritas|shift|rencana|hse|hari ini|pagi|briefing/.test(text)) return "prioritas"
  return "bantuan"
}

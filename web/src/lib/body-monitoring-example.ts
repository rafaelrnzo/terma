import type { BodySignal } from "./body-monitoring"

const scenarios = [
  { name: "Jeda minum meningkat", wbgt: 29.6, heat: true, gap: 58, target: 20, heartRate: 106, skin: 35.1, planned: 216, cap: 384, worked: 148 },
  { name: "Paparan panas meningkat", wbgt: 31.8, heat: true, gap: 18, target: 15, heartRate: 118, skin: 35.8, planned: 180, cap: 288, worked: 104 },
  { name: "Kerja dan hidrasi terpantau", wbgt: 27.2, heat: false, gap: 12, target: 30, heartRate: 86, skin: 33.8, planned: 300, cap: 480, worked: 192 },
] as const

/** Presentation-only examples: never create sensor events, consent, plans or medical history. */
export function exampleBodyMonitoring(code: string, date: string, clinical: boolean) {
  const index = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0) % scenarios.length
  const scenario = scenarios[index]
  const asOf = Date.parse(`${date}T13:40:00+07:00`)
  const observedAt = new Date(asOf).toISOString()
  const drinkAt = new Date(asOf - scenario.gap * 60000).toISOString()
  const missed = scenario.gap > scenario.target * 1.5
  const factors = Number(scenario.heat) + Number(missed)
  const number = (value: number) => value.toFixed(1).replace(".", ",")
  const signals: BodySignal[] = [
    { key: "heat", title: "Paparan panas", value: `${number(scenario.wbgt)} °C WBGT`, tone: scenario.heat ? "attention" : "recorded", source: "Ilustrasi · Station ST-01", observedAt,
      explanation: `Cuplikan contoh panas lingkungan ${number(scenario.wbgt)} °C WBGT. ${scenario.heat ? "Marker panas menyala untuk menunjukkan peninjauan jadwal kerja–istirahat." : "Paparan pada skenario ini berada dalam target jadwal kerja."} WBGT bukan suhu tubuh.`, action: "Lihat alokasi kerja dan jeda istirahat pada contoh rencana." },
    { key: "hydration", title: "Hidrasi & titik minum", value: `${scenario.gap} menit sejak kunjungan minum`, tone: missed ? "attention" : "recorded", source: "Ilustrasi · Water Station WS-01", observedAt: drinkAt,
      explanation: `Contoh kunjungan terakhir ${scenario.gap} menit sebelum cuplikan, dengan target kunjungan setiap ${scenario.target} menit. ${missed ? "Jeda melewati target; marker hidrasi menandai perlunya konfirmasi minum." : "Kunjungan masih mengikuti target skenario."} Kunjungan tidak mengukur volume air atau memastikan dehidrasi.`, action: missed ? "Contoh tindak lanjut: mandor mengonfirmasi akses minum dan kondisi pekerja." : "Contoh tindak lanjut: lanjutkan akses minum dan pencatatan kunjungan." },
    { key: "band", title: "Band · sinyal tubuh", value: clinical ? `${scenario.heartRate} bpm · kulit ${number(scenario.skin)} °C` : "Band aktif · kualitas sinyal baik", tone: "recorded", source: "Ilustrasi · Band TB-01", observedAt,
      explanation: clinical ? `Contoh denyut ${scenario.heartRate} bpm dan suhu kulit ${number(scenario.skin)} °C berasal dari skenario ilustrasi. Suhu kulit berbeda dari suhu inti.` : "Contoh Band terpasang dan mengirim sinyal dengan kualitas baik. Nilai denyut dan suhu kulit tersedia pada tampilan Klinik; HSE melihat status perangkat.", action: "Periksa pemasangan dan kualitas sinyal Band pada contoh pemantauan." },
    { key: "kidneys", title: "Pencegahan risiko ginjal", value: factors ? `${factors} faktor paparan perlu perhatian` : "Pencegahan rutin · faktor paparan terkendali", tone: factors ? "attention" : "recorded", source: "Ilustrasi · konteks panas dan hidrasi", observedAt,
      explanation: factors ? `${[scenario.heat && "Paparan panas meningkat", missed && "jeda kunjungan minum memanjang"].filter(Boolean).join(" dan ")} pada skenario ini. Marker ginjal menghubungkan faktor tersebut dengan tindak lanjut pencegahan, tanpa menyatakan kerusakan organ.` : "Pada contoh ini, jadwal kerja dan kunjungan minum mengikuti target. Pemantauan pencegahan tetap berjalan; fungsi ginjal tidak disimpulkan dari sensor.", action: factors ? "Contoh tindak lanjut: tinjau panas, hidrasi, pemulihan dan kebutuhan pemeriksaan Klinik." : "Contoh tindak lanjut: pertahankan jadwal kerja–istirahat dan pemantauan rutin." },
    { key: "exposure", title: "Beban & pemulihan", value: `${scenario.worked}/${scenario.planned} menit kerja tercatat`, tone: "recorded", source: "Ilustrasi · rencana dan laporan shift", observedAt,
      explanation: `Contoh rencana ${scenario.planned} menit kerja dari batas harian ${scenario.cap} menit. Pada cuplikan pukul 13.40 WIB, ${scenario.worked} menit telah dijalankan dan ${scenario.planned - scenario.worked} menit tersisa. Angka ini bukan laporan shift yang tersimpan.`, action: "Ikuti sisa alokasi dan jeda pemulihan pada skenario ini." },
  ]
  return { signals, asOf, scenario: scenario.name, clinicalNote: undefined }
}

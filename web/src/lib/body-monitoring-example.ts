import { coreTemperatureSeries } from "./band-physiology"
import type { BodyMetric, BodyRegion, BodySignal } from "./body-monitoring"

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
  const summaries: Omit<BodySignal,"metrics" | "explanation" | "action">[] = [
    { key: "heat", title: "Paparan panas", value: `${number(scenario.wbgt)} °C WBGT`, tone: scenario.heat ? "attention" : "recorded", source: "Ilustrasi · Station ST-01", observedAt },
    { key: "hydration", title: "Hidrasi & titik minum", value: `${scenario.gap} menit sejak kunjungan minum`, tone: missed ? "attention" : "recorded", source: "Ilustrasi · Water Station WS-01", observedAt: drinkAt },
    { key: "band", title: "Band · sinyal tubuh", value: clinical ? `${scenario.heartRate} bpm · kulit ${number(scenario.skin)} °C` : "Band aktif · kualitas sinyal baik", tone: "recorded", source: "Ilustrasi · Band TB-01", observedAt },
    { key: "kidneys", title: "Pencegahan risiko ginjal", value: factors ? `${factors} faktor paparan perlu perhatian` : "Pencegahan rutin · faktor paparan terkendali", tone: factors ? "attention" : "recorded", source: "Ilustrasi · konteks panas dan hidrasi", observedAt },
    { key: "exposure", title: "Beban & pemulihan", value: `${scenario.worked}/${scenario.planned} menit kerja tercatat`, tone: "recorded", source: "Ilustrasi · rencana dan laporan shift", observedAt },
  ]
  const estimates=coreTemperatureSeries(Array.from({length:180},(_,minute)=>75+(scenario.heartRate-75)*Math.min(1,minute/120)))
  const latest=estimates.at(-1)!
  const metrics:Record<BodyRegion,BodyMetric[]>={
    heat:[{label:"Puncak WBGT",value:number(scenario.wbgt),unit:"°C",note:"Ilustrasi · Station"},{label:"Interval tersedia",value:"8",unit:"/ 8"}],
    hydration:[{label:"Sejak kunjungan",value:String(scenario.gap),unit:"mnt"},{label:"Target interval",value:String(scenario.target),unit:"mnt"},{label:"Kunjungan tercatat",value:missed ? "9" : "16",unit:"scan"}],
    band:[...(clinical ? [{label:"Denyut jantung",value:String(scenario.heartRate),unit:"bpm"},{label:"Suhu kulit",value:number(scenario.skin),unit:"°C"},{label:"Estimasi suhu inti",value:number(latest.temperature),unit:"°C",note:"Buller 2013 · ilustrasi"},{label:"Denyut puncak",value:String(scenario.heartRate),unit:"bpm"}] : []),{label:"Sinyal PPG",value:"Baik"},{label:"Baterai",value:"78",unit:"%"},{label:"Sampel berurutan",value:"360"},{label:"Pembaruan terakhir",value:"13.40"}],
    kidneys:[{label:"Paparan perlu ditinjau",value:String(factors),unit:"faktor"},{label:"Paparan terverifikasi",value:"—",unit:"mnt / bulan"}],
    exposure:[{label:"Kerja tercatat",value:String(scenario.worked),unit:"mnt"},{label:"Alokasi kerja",value:String(scenario.planned),unit:"mnt"},{label:"Batas harian",value:String(scenario.cap),unit:"mnt"},{label:"Sisa alokasi",value:String(scenario.planned-scenario.worked),unit:"mnt"}],
  }
  const explanations:Record<BodyRegion,string>={heat:"Panas lingkungan dari Station; tinjau alokasi kerja–istirahat.",hydration:"Scan mencatat kunjungan, tanpa pengukuran volume air.",band:clinical ? "Estimasi suhu inti dari rangkaian denyut per menit; suhu kulit adalah bacaan terpisah. Model Buller 2013, belum divalidasi di lokasi." : "Status perangkat Band. Nilai fisiologis tersedia pada Klinik.",kidneys:"Konteks panas dan jeda minum untuk tindak lanjut pencegahan; fungsi ginjal memerlukan pemeriksaan Klinik.",exposure:"Durasi kerja dibanding alokasi dan batas harian."}
  const actions:Record<BodyRegion,string>={heat:"Tinjau jadwal kerja–istirahat.",hydration:missed ? "Konfirmasi akses minum dengan mandor." : "Lanjutkan jadwal kunjungan minum.",band:"Periksa pemasangan dan kualitas sinyal.",kidneys:factors ? "Tinjau paparan dan kebutuhan pemeriksaan Klinik." : "Lanjutkan pemantauan rutin.",exposure:"Ikuti sisa alokasi dan jeda pemulihan."}
  const signals:BodySignal[]=summaries.map(signal=>({...signal,metrics:metrics[signal.key],explanation:explanations[signal.key],action:actions[signal.key]}))
  return { signals, asOf, bandTrend:clinical ? estimates.map((estimate,minute)=>({minute,value:estimate.temperature})) : [], scenario: scenario.name, clinicalNote: undefined }
}

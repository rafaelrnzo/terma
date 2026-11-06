import { hasConsent, medicalProfileFor } from "./clinic"
import { managementOf } from "./management-state"
import { monthlyExposure } from "./exposure-review"
import type { AppState } from "./store-state"
import type { User } from "./types"

export type BodyRegion = "heat" | "hydration" | "band" | "kidneys" | "exposure"
export type SignalTone = "attention" | "recorded" | "unknown"
export interface BodySignal { key: BodyRegion; title: string; value: string; tone: SignalTone; explanation: string; source: string; observedAt?: string; action: string }

/** Authorized view model. A water visit is not an intake measurement, and no signal diagnoses kidney disease. */
export function bodyMonitoring(s: AppState, user: User, code: string, date: string, now=Date.now()) {
  const m=managementOf(s)
  if (!["HSE","KLINIK"].includes(user.role) || !m.workers.some(row=>row.kode===code)) return null
  const shift=m.shifts.find(row=>row.tanggal===date && row.workspace.pekerja.some(worker=>worker.kode===code))
  const plan=shift?.workspace.rencana.find(row=>row.pekerjaKode===code && !row.digantikan)
  const events=(shift?.personalTelemetry ?? []).filter(event=>event.pekerjaKode===code && Date.parse(event.observedAt)<=now).toSorted((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt))
  const today=new Date(now).toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"})
  const asOf=date===today ? now : events.length ? Date.parse(events[0].observedAt) : Date.parse(`${date}T16:00:00+07:00`)
  const coverage=events.find(event=>event.type==="WATER_COVERAGE")
  const water=events.find(event=>event.type==="WATER_VISIT")
  const band=events.find(event=>event.type==="BAND_READING")
  const waterConnected=coverage?.type==="WATER_COVERAGE" && coverage.online && asOf-Date.parse(coverage.observedAt)<=15*60000
  const target=Math.min(...(plan?.intervals.map(interval=>interval.drinkInterval ?? 30) ?? [30]))
  const lastDrink=water?.observedAt ?? (coverage?.type==="WATER_COVERAGE" ? coverage.coverageFrom : undefined)
  const gap=waterConnected && lastDrink ? Math.max(0,Math.floor((asOf-Date.parse(lastDrink))/60000)) : null
  const missed=gap!==null && gap>target*1.5
  const validHeat=plan?.intervals.filter(row=>row.isbb!==null && row.kualitas!=="KEDALUWARSA" && row.kualitas!=="TIDAK_TERSEDIA") ?? []
  const peak=validHeat.length ? Math.max(...validHeat.map(row=>row.isbb!)) : null
  const heatAttention=plan?.riskColour==="MERAH" || plan?.riskColour==="KUNING" || plan?.status==="BATASI_ATAU_PINDAHKAN"
  const baseline=shift?.readiness?.baselines.find(row=>row.pekerjaKode===code) ?? (!shift ? m.healthBaselines?.find(row=>row.pekerjaKode===code) : undefined)
  const clinical=user.role==="KLINIK" ? medicalProfileFor(s,user,code) : undefined
  const renalFactors=clinical ? [clinical.hipertensi && "Hipertensi tercatat",clinical.diabetes && "Diabetes tercatat",clinical.riwayatPanas && "Riwayat sakit akibat panas"].filter(Boolean) as string[] : []
  const healthFactor=plan?.alasan.some(reason=>reason.startsWith("Ada faktor kesehatan")) ?? false
  const checkin=user.role==="KLINIK" ? shift?.readiness?.checkins.find(row=>row.pekerjaKode===code) : undefined
  const exposure=monthlyExposure({...s,tanggal:date},user).find(row=>row.worker.kode===code)
  const bandAllowed=hasConsent(s,code,"BAND")
  const bandFresh=band?.type==="BAND_READING" && asOf-Date.parse(band.observedAt)<=5*60000 && bandAllowed
  const signals: BodySignal[]=[
    {key:"heat",title:"Paparan panas",value:peak===null ? "WBGT belum tersedia" : `${peak.toFixed(1).replace(".",",")} °C WBGT`,tone:peak===null ? "unknown" : heatAttention ? "attention" : "recorded",source:plan ? `${plan.kualitas.replaceAll("_"," ")} · rencana v${plan.version}` : "Belum ada rencana",explanation:peak===null ? "Belum ada data panas untuk penugasan ini." : "Puncak WBGT pada rencana menunjukkan panas lingkungan, bukan suhu tubuh. Periksa alokasi kerja dan istirahat per jam.",action:"Buka versi rencana dan ikuti arahan kerja yang disetujui HSE."},
    {key:"hydration",title:"Hidrasi & titik minum",value:gap===null ? "Data minum belum tersedia" : `${gap} menit sejak ${water ? "kunjungan minum" : "pemantauan dimulai"}`,tone:gap===null ? "unknown" : missed ? "attention" : "recorded",source:coverage ? `${coverage.origin} · ${coverage.deviceId}` : "Water Station belum terhubung ke pekerja",observedAt:water?.observedAt ?? coverage?.observedAt,explanation:gap===null ? "Koneksi pemantauan dan kunjungan minum yang sesuai ID pekerja belum tersedia atau kedaluwarsa. Kekosongan data tidak membuktikan pekerja sudah minum." : missed ? `Jeda melewati ${Math.round(target*1.5)} menit menurut target rencana. Ini penanda jeda kunjungan, bukan pengukuran volume air atau diagnosis dehidrasi.` : "Kunjungan tercatat. Scan kartu tidak mengukur berapa banyak air yang diminum atau memastikan status hidrasi.",action:missed ? "Mandor mengonfirmasi kondisi dan akses minum sesuai instruksi shift." : "Periksa kunjungan Water Station dan waktu pembaruan koneksi."},
    {key:"band",title:"Band · sinyal tubuh",value:!bandFresh ? "Belum ada bacaan Band valid" : user.role==="KLINIK" && band?.type==="BAND_READING" ? `${band.heartRate} bpm · kulit ${band.skinTemperature.toFixed(1)} °C` : band?.type==="BAND_READING" && band.quality==="LOW_SIGNAL" ? "Kualitas sinyal perlu diperiksa" : "Bacaan Band tercatat",tone:!bandFresh ? "unknown" : band?.type==="BAND_READING" && band.quality==="LOW_SIGNAL" ? "attention" : "recorded",source:bandFresh && band ? `${band.origin} · ${band.deviceId}` : !bandAllowed ? "Persetujuan Band belum aktif" : "Bacaan belum tersedia atau kedaluwarsa",observedAt:bandFresh ? band?.observedAt : undefined,explanation:"Sinyal harus sesuai pekerja dan periode serah-terima Band. Suhu kulit berbeda dari suhu inti; estimasi suhu inti belum tersedia. Nilai fisiologis hanya terlihat oleh Klinik dengan persetujuan aktif.",action:"Periksa serah-terima, persetujuan, dan kualitas koneksi Band."},
    {key:"kidneys",title:"Pencegahan risiko ginjal",value:renalFactors.length ? `${renalFactors.length} faktor klinis tercatat` : missed || heatAttention || healthFactor ? "Faktor risiko perlu ditinjau" : "Fungsi ginjal belum dinilai",tone:renalFactors.length || missed || heatAttention || healthFactor ? "attention" : "unknown",source:renalFactors.length ? "Profil Klinik · persetujuan MCU aktif" : "Konteks paparan & hidrasi",explanation:renalFactors.length ? renalFactors.join(" · ")+". Riwayat dan sinyal ini tidak menunjukkan fungsi ginjal saat ini." : "Panas, jeda minum, dan paparan berulang adalah konteks pencegahan. Marker ini tidak menunjukkan letak kerusakan atau memastikan penyakit ginjal; fungsi ginjal memerlukan pemeriksaan Klinik.",action:"Klinik meninjau faktor risiko dan kebutuhan pemeriksaan lanjutan."},
    {key:"exposure",title:"Beban & pemulihan",value:plan ? `${plan.totalKerjaMenit}/${plan.batasHarianMenit} menit direncanakan` : "Rencana belum tersedia",tone:plan ? "recorded" : "unknown",source:plan ? `Rencana v${plan.version} · ${plan.persenAdaptasi}% adaptasi` : "Belum ada penugasan",explanation:`Durasi rencana berbeda dari paparan aktual. Bulan ini ${exposure?.verifiedMinutes ?? 0} menit pada ${exposure?.verifiedShifts ?? 0} shift telah diverifikasi; tidak ada skor kerusakan ginjal yang dihitung.`,action:"Pantau jadwal kerja–istirahat dan lengkapi laporan durasi aktual."},
  ]
  return {signals,asOf,clinicalNote:checkin ? `${checkin.kondisi==="BAIK" ? "Merasa baik" : "Kurang sehat"}${checkin.keluhan.length ? ` · ${checkin.keluhan.join(", ")}` : ""}` : undefined,baselineStatus:baseline?.status}
}

import { bandPhysiology, type BandReading } from "./band-physiology"
import { hasConsent, medicalProfileFor } from "./clinic"
import { managementOf } from "./management-state"
import { monthlyExposure } from "./exposure-review"
import { stationWbgt } from "./iot"
import { placementOf } from "./station-placement"
import type { AppState } from "./store-state"
import type { User } from "./types"

export type BodyRegion = "heat" | "hydration" | "band" | "kidneys" | "exposure"
export type SignalTone = "attention" | "recorded" | "unknown"
export interface BodyMetric { label: string; value: string; unit?: string; note?: string }
export interface BodySignal { metrics?: BodyMetric[]; key: BodyRegion; title: string; value: string; tone: SignalTone; explanation: string; source: string; observedAt?: string; action: string }

/** Authorized view model. A water visit is not an intake measurement, and no signal diagnoses kidney disease. */
export function bodyMonitoring(s: AppState, user: User, code: string, date: string, now=Date.now()) {
  const m=managementOf(s)
  if (!["ADMIN","HSE","KLINIK"].includes(user.role) || !m.workers.some(row=>row.kode===code)) return null
  const clinicalAccess=user.role==="KLINIK" || user.role==="ADMIN"
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
  const planPeak=validHeat.length ? Math.max(...validHeat.map(row=>row.isbb!)) : null
  const assignment=shift?.workspace.penugasan.find(row=>row.pekerjaKode===code) ?? (!shift ? m.assignments.find(row=>row.pekerjaKode===code) : undefined)
  const station=shift?.status!=="CLOSED" ? m.latestStationEvents?.filter(event=>(placementOf(s,event.deviceId)?.zonaKode ?? event.zone)===assignment?.zonaKode && Date.parse(event.receivedAt)<=now && new Date(event.receivedAt).toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"})===date).toSorted((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt))[0] : undefined
  const stationFresh=!!station && now-Date.parse(station.receivedAt)<=90000
  const peak=station ? stationWbgt(station,placementOf(s,station.deviceId)?.selisihGlobe ?? 0).isbb : planPeak
  const heatAttention=plan?.riskColour==="MERAH" || plan?.riskColour==="KUNING" || plan?.status==="BATASI_ATAU_PINDAHKAN"
  const baseline=shift?.readiness?.baselines.find(row=>row.pekerjaKode===code) ?? (!shift ? m.healthBaselines?.find(row=>row.pekerjaKode===code) : undefined)
  const clinical=clinicalAccess ? medicalProfileFor(s,user,code) : undefined
  const renalFactors=clinical ? [clinical.hipertensi && "Hipertensi tercatat",clinical.diabetes && "Diabetes tercatat",clinical.riwayatPanas && "Riwayat sakit akibat panas"].filter(Boolean) as string[] : []
  const healthFactor=plan?.alasan.some(reason=>reason.startsWith("Ada faktor kesehatan")) ?? false
  const checkin=clinicalAccess ? shift?.readiness?.checkins.find(row=>row.pekerjaKode===code) : undefined
  const exposure=monthlyExposure({...s,tanggal:date},user).find(row=>row.worker.kode===code)
  const bandAllowed=hasConsent(s,code,"BAND")
  const bandAssignment=shift?.bands?.find(row=>row.bandId===band?.deviceId && row.pekerjaKode===code && row.dipakaiPada && Date.parse(row.dipakaiPada)<=Date.parse(band!.observedAt) && (!row.dikembalikanPada || Date.parse(band!.observedAt)<=Date.parse(row.dikembalikanPada)))
  const bandFresh=band?.type==="BAND_READING" && asOf-Date.parse(band.observedAt)<=5*60000 && bandAllowed && !!bandAssignment
  const physiology=bandFresh && bandAssignment ? bandPhysiology(events.filter((event): event is BandReading=>event.type==="BAND_READING" && event.deviceId===bandAssignment.bandId && Date.parse(event.observedAt)>=Date.parse(bandAssignment.dipakaiPada!) && (!bandAssignment.dikembalikanPada || Date.parse(event.observedAt)<=Date.parse(bandAssignment.dikembalikanPada)))) : null
  const visits=events.filter(event=>event.type==="WATER_VISIT").length
  const number=(value:number)=>value.toFixed(1).replace(".",",")
  const signals: BodySignal[]=[
    {key:"heat",title:"Paparan panas",value:peak===null ? "WBGT belum tersedia" : `${peak.toFixed(1).replace(".",",")} °C WBGT`,tone:peak===null || (station && !stationFresh) ? "unknown" : heatAttention ? "attention" : "recorded",source:station ? `AKTUAL · ${station.deviceId} · ${assignment?.zonaKode}${stationFresh ? "" : " · kedaluwarsa"}` : plan ? `${plan.kualitas.replaceAll("_"," ")} · rencana v${plan.version}` : "Belum ada rencana",observedAt:station?.receivedAt,explanation:station ? "ISBB dari bacaan Station pada zona pekerja, dihitung dari bola basah dan suhu udara. Puncak rencana dan alokasi kerja ditampilkan terpisah." : peak===null ? "Belum ada data panas untuk penugasan ini." : "Puncak WBGT pada rencana menunjukkan panas lingkungan, bukan suhu tubuh. Periksa alokasi kerja dan istirahat per jam.",action:"Periksa pembaruan Station dan ikuti rencana kerja yang disetujui HSE."},
    {key:"hydration",title:"Hidrasi & titik minum",value:gap===null ? "Data minum belum tersedia" : `${gap} menit sejak ${water ? "kunjungan minum" : "pemantauan dimulai"}`,tone:gap===null ? "unknown" : missed ? "attention" : "recorded",source:coverage ? `${coverage.origin} · ${coverage.deviceId}` : "Water Station belum terhubung ke pekerja",observedAt:water?.observedAt ?? coverage?.observedAt,explanation:gap===null ? "Koneksi pemantauan dan kunjungan minum yang sesuai ID pekerja belum tersedia atau kedaluwarsa. Kekosongan data tidak membuktikan pekerja sudah minum." : missed ? `Jeda melewati ${Math.round(target*1.5)} menit menurut target rencana. Ini penanda jeda kunjungan, bukan pengukuran volume air atau diagnosis dehidrasi.` : "Kunjungan tercatat. Scan kartu tidak mengukur berapa banyak air yang diminum atau memastikan status hidrasi.",action:missed ? "Mandor mengonfirmasi kondisi dan akses minum sesuai instruksi shift." : "Periksa kunjungan Water Station dan waktu pembaruan koneksi."},
    {key:"band",title:"Band · sinyal tubuh",value:!bandFresh ? "Belum ada bacaan Band valid" : clinicalAccess && band?.type==="BAND_READING" ? `${band.heartRate} bpm · kulit ${band.skinTemperature.toFixed(1)} °C` : band?.type==="BAND_READING" && band.quality==="LOW_SIGNAL" ? "Kualitas sinyal perlu diperiksa" : "Bacaan Band tercatat",tone:!bandFresh ? "unknown" : band?.type==="BAND_READING" && band.quality==="LOW_SIGNAL" ? "attention" : "recorded",source:bandFresh && band ? `${band.origin} · ${band.deviceId}` : !bandAllowed ? "Persetujuan Band belum aktif" : "Bacaan belum tersedia atau kedaluwarsa",observedAt:bandFresh ? band?.observedAt : undefined,explanation:"Sinyal harus sesuai pekerja dan periode serah-terima Band. Suhu kulit berbeda dari suhu inti; estimasi suhu inti belum tersedia. Nilai fisiologis terlihat oleh Klinik dan Admin dengan persetujuan aktif.",action:"Periksa serah-terima, persetujuan, dan kualitas koneksi Band."},
    {key:"kidneys",title:"Pencegahan risiko ginjal",value:renalFactors.length ? `${renalFactors.length} faktor klinis tercatat` : missed || heatAttention || healthFactor ? "Faktor risiko perlu ditinjau" : "Fungsi ginjal belum dinilai",tone:renalFactors.length || missed || heatAttention || healthFactor ? "attention" : "unknown",source:renalFactors.length ? "Profil Klinik · persetujuan MCU aktif" : "Konteks paparan & hidrasi",explanation:renalFactors.length ? renalFactors.join(" · ")+". Riwayat dan sinyal ini tidak menunjukkan fungsi ginjal saat ini." : "Panas, jeda minum, dan paparan berulang adalah konteks pencegahan. Marker ini tidak menunjukkan letak kerusakan atau memastikan penyakit ginjal; fungsi ginjal memerlukan pemeriksaan Klinik.",action:"Klinik meninjau faktor risiko dan kebutuhan pemeriksaan lanjutan."},
    {key:"exposure",title:"Beban & pemulihan",value:plan ? `${plan.totalKerjaMenit}/${plan.batasHarianMenit} menit direncanakan` : "Rencana belum tersedia",tone:plan ? "recorded" : "unknown",source:plan ? `Rencana v${plan.version} · ${plan.persenAdaptasi}% adaptasi` : "Belum ada penugasan",explanation:`Durasi rencana berbeda dari paparan aktual. Bulan ini ${exposure?.verifiedMinutes ?? 0} menit pada ${exposure?.verifiedShifts ?? 0} shift telah diverifikasi; tidak ada skor kerusakan ginjal yang dihitung.`,action:"Pantau jadwal kerja–istirahat dan lengkapi laporan durasi aktual."},
  ]
  const metrics: Record<BodyRegion, BodyMetric[]>={
    heat:[{label:station ? "WBGT Station" : "Puncak WBGT rencana",value:peak===null ? "—" : number(peak),unit:"°C",note:station ? `AKTUAL · ${stationFresh ? "Station" : "kedaluwarsa"}` : plan ? ({TERUKUR:"Terukur",REPLAY:"Replay",PRAKIRAAN_SAJA:"Prakiraan · belum terkalibrasi",KEDALUWARSA:"Kedaluwarsa",TIDAK_TERSEDIA:"Belum tersedia"})[plan.kualitas] : "Belum tersedia"},...(station ? [{label:"Suhu udara",value:number(station.airC),unit:"°C"},{label:"Kelembapan",value:String(station.humidityPct),unit:"%"},{label:"Puncak rencana",value:planPeak===null ? "—" : number(planPeak),unit:"°C",note:plan?.kualitas.replaceAll("_"," ")}] : []),{label:"Interval tersedia",value:String(validHeat.length),unit:`/ ${plan?.intervals.length ?? 0}`}],
    hydration:[{label:"Sejak kunjungan",value:gap===null ? "—" : String(gap),unit:"mnt"},{label:"Target interval",value:plan ? String(target) : "—",unit:"mnt"},{label:"Kunjungan tercatat",value:waterConnected || water ? String(visits) : "—",unit:"scan"}],
    band:[...(clinicalAccess && bandFresh && band?.type==="BAND_READING" ? [{label:"Denyut jantung",value:String(band.heartRate),unit:"bpm"},{label:"Suhu kulit",value:number(band.skinTemperature),unit:"°C"},{label:"Estimasi suhu inti",value:physiology?.estimate ? number(physiology.estimate.temperature) : "—",unit:"°C",note:physiology?.estimate ? "Buller 2013 · pilot" : "Perlu 30 menit berurutan"},{label:"Denyut puncak",value:physiology ? String(physiology.peakHeartRate) : "—",unit:"bpm"}] : []),{label:"Sinyal PPG",value:!bandFresh ? "—" : band?.type==="BAND_READING" && band.quality==="VALID" ? "Baik" : "Lemah"},{label:"Baterai",value:bandFresh && band?.type==="BAND_READING" && band.batteryPercent!==undefined ? String(band.batteryPercent) : "—",unit:"%"},{label:"Sampel berurutan",value:physiology ? String(physiology.samples) : "—"},{label:"Pembaruan terakhir",value:bandFresh && band ? new Date(band.observedAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}) : "—"}],
    kidneys:[{label:"Paparan perlu ditinjau",value:plan || gap!==null ? String(Number(!!heatAttention)+Number(missed)+Number(healthFactor)) : "—",unit:"faktor"},{label:"Paparan terverifikasi",value:String(exposure?.verifiedMinutes ?? 0),unit:"mnt / bulan"}],
    exposure:[{label:"Alokasi kerja",value:plan ? String(plan.totalKerjaMenit) : "—",unit:"mnt"},{label:"Batas harian",value:plan ? String(plan.batasHarianMenit) : "—",unit:"mnt"},{label:"Adaptasi",value:plan ? String(plan.persenAdaptasi) : "—",unit:"%"},{label:"Durasi terverifikasi",value:String(exposure?.verifiedMinutes ?? 0),unit:"mnt / bulan"}],
  }
  for(const signal of signals) signal.metrics=metrics[signal.key]
  const bandSignal=signals.find(signal=>signal.key==="band")!
  if(clinicalAccess && physiology?.estimate) bandSignal.explanation="Estimasi suhu inti dari rerata denyut per menit, model Buller 2013. Suhu kulit adalah bacaan terpisah. Model pilot belum divalidasi pada pekerja lokasi ini."
  return {signals,asOf,bandTrend:clinicalAccess ? physiology?.trend ?? [] : [],clinicalNote:checkin ? `${checkin.kondisi==="BAIK" ? "Merasa baik" : "Kurang sehat"}${checkin.keluhan.length ? ` · ${checkin.keluhan.join(", ")}` : ""}` : undefined,baselineStatus:baseline?.status}
}

import { describe, expect, it } from "vitest"
import { emptyWorkspaceState, reducer, rencanaAktif, readDemoState } from "./store"
import { calculatePaperPlan, estimateForecastWbgt } from "./paper-rules"
import { currentShift } from "./management-state"
import { medicalProfileFor, medicalRiskPoints, clinicInbox } from "./clinic"
import { workerHealthRows } from "./worker-health"
import { USERS, JAM_SHIFT } from "./config"
import { pageAllowedFor } from "./navigation"
import type { Action, AppState } from "./store-state"

const date="2026-11-06"
const hse=USERS[0], clinic=USERS.find(row=>row.role==="KLINIK")!
const run=(state:AppState,...actions:Action[])=>actions.reduce(reducer,state)
function prepared() {
  let s=run(emptyWorkspaceState(date),{type:"SIMPAN_PEKERJA",input:{kode:"W01",nama:"Adi",reguKode:"COR",tanggalMulai:date,tugasKode:"PEMERIKSAAN",zonaKode:"GUDANG",apd:"Standar"}},{type:"BUAT_SHIFT",tanggal:date,nama:"Shift pagi",workerCodes:["W01"]},{type:"KONFIRMASI",pekerjaKode:"W01",profil:"PEKERJA_BARU",hari:1})
  for(const hour of JAM_SHIFT) s=reducer(s,{type:"INPUT_BACAAN",zonaKode:"GUDANG",jamMulai:hour,isbb:29-(hour-8),idAlat:"QA",kalibrasi:"QA"})
  return s
}
const medical={pekerjaKode:"W01",hipertensi:true,diabetes:true,jantung:true,riwayatPanas:true,obatBerisiko:false,tinggiCm:170,beratKg:90,catatan:"Catatan privat pemeriksa"}

describe("PDF morning and clinical flow",()=>{
  it("creates the morning draft and permits approval/publication before check-in",()=>{
    let s=prepared()
    expect(currentShift(s)?.calculationVersion).toBe("PDF_V0")
    expect(rencanaAktif(s)).toHaveLength(1)
    expect(currentShift(s)?.readiness?.checkins).toHaveLength(0)
    s=run(s,{type:"SETUJUI",rencanaId:rencanaAktif(s)[0].id},{type:"TERBITKAN_SHIFT",shiftId:date})
    expect(currentShift(s)?.status).toBe("ACTIVE")
  })
  it("accepts post-approval check-in, versions the plan and keeps the approved record",()=>{
    let s=prepared()
    const first=rencanaAktif(s)[0]
    s=run(s,{type:"SETUJUI",rencanaId:first.id},{type:"TERBITKAN_SHIFT",shiftId:date})
    const approved=s.rencana.find(row=>row.id===first.id)!
    s=reducer(s,{type:"CATAT_CHECKIN",persetujuan:true,pekerjaKode:"W01",kondisi:"ADA_KELUHAN",keluhan:["Pusing"]})
    const next=rencanaAktif(s)[0]
    expect(s.notice?.tipe).not.toBe("error")
    expect(next.version).toBe(2)
    expect(next.disetujuiOleh).toBeUndefined()
    expect(s.rencana.find(row=>row.id===first.id)).toEqual({...approved,digantikan:true})
    expect(next.totalKerjaMenit).toBeLessThanOrEqual(approved.totalKerjaMenit)
    expect(JSON.stringify(next)).not.toContain("Pusing")
    expect(next.alasan).toContain("Ada faktor kesehatan hari ini")
    expect(readDemoState(JSON.stringify(s)).management?.shifts[0].readiness?.checkins).toHaveLength(1)
    expect(clinicInbox(s,hse,date)).toEqual([])
    expect(clinicInbox(s,clinic,date)[0].checkin.keluhan).toEqual(["Pusing"])
    expect(workerHealthRows(s.management!,hse,date)[0].health?.checkin).toBeUndefined()
  })
  it("allocates the 20% daily cap to cooler hours and respects each tightened hourly cap",()=>{
    const s=prepared(), plan=calculatePaperPlan(s,s.pekerja[0])!
    expect(plan.batasHarianMenit).toBe(96)
    expect(plan.totalKerjaMenit).toBe(96)
    expect(plan.intervals[0].kerjaDirencanakan).toBe(0)
    expect(plan.intervals.at(-1)!.kerjaDirencanakan).toBeGreaterThan(0)
    for(const interval of plan.intervals) expect(interval.kerjaDirencanakan).toBeLessThanOrEqual(interval.kerjaMaksMenit)
  })
  it("labels forecast estimates and missing inputs instead of fabricating measurements",()=>{
    const s=prepared()
    s.bacaan=[]
    s.prakiraan=[{tanggal:date,lokasi:"QA",jamMulai:8,intervalJam:3,suhu:30,kelembapan:60,waktuProduksi:`${date}T00:00:00Z`}]
    const plan=calculatePaperPlan(s,s.pekerja[0])!
    expect(plan.intervals[0].kualitas).toBe("PRAKIRAAN_SAJA")
    expect(plan.intervals[0].catatan).toContain("belum terkalibrasi")
    expect(plan.intervals.at(-1)!.isbb).toBeNull()
    expect(plan.intervals.at(-1)!.riskColour).toBe("DATA_KURANG")
    expect(s.bacaan).toHaveLength(0)
    expect(estimateForecastWbgt(30,60)).toBeCloseTo(30.9213,4)
    expect(estimateForecastWbgt(30,101)).toBeNull()
  })
  it("gates clinical writes, reads and use of flags by role and active consent",()=>{
    let s=prepared()
    expect(reducer(s,{type:"SIMPAN_PROFIL_MEDIS",input:medical}).notice?.tipe).toBe("error")
    s=reducer(s,{type:"LOGIN",userId:clinic.id})
    s=reducer(s,{type:"SIMPAN_PROFIL_MEDIS",input:medical})
    expect(s.management?.clinic?.profiles ?? []).toHaveLength(0)
    s=run(s,{type:"PERSETUJUAN_MEDIS",pekerjaKode:"W01",jenis:"MCU",aktif:true},{type:"SIMPAN_PROFIL_MEDIS",input:medical})
    expect(medicalProfileFor(s,clinic,"W01")?.catatan).toBe(medical.catatan)
    expect(medicalProfileFor(s,hse,"W01")).toBeUndefined()
    expect(medicalRiskPoints(s,"W01").points).toBeGreaterThan(0)
    s=reducer(s,{type:"PERSETUJUAN_MEDIS",pekerjaKode:"W01",jenis:"MCU",aktif:false})
    expect(medicalRiskPoints(s,"W01")).toEqual({points:0,available:false})
    expect(medicalProfileFor(s,clinic,"W01")).toBeUndefined()
    expect(JSON.stringify(s.audit)).not.toContain(medical.catatan)
  })
  it("requires first-check-in consent and keeps closed snapshots unchanged by clinical master updates",()=>{
    let s=prepared()
    expect(reducer(s,{type:"CATAT_CHECKIN",pekerjaKode:"W01",kondisi:"BAIK",keluhan:[]}).notice?.tipe).toBe("error")
    const shift=currentShift(s)!
    s={...s,management:{...s.management!,shifts:[{...shift,status:"CLOSED"}]}}
    const snapshot=JSON.stringify(s.management!.shifts[0])
    s=run(s,{type:"LOGIN",userId:clinic.id},{type:"PERSETUJUAN_MEDIS",pekerjaKode:"W01",jenis:"MCU",aktif:true},{type:"SIMPAN_PROFIL_MEDIS",input:medical})
    expect(JSON.stringify(s.management!.shifts[0])).toBe(snapshot)
    const malformed={...s,management:{...s.management!,clinic:{...s.management!.clinic!,profiles:null}}}
    expect(()=>readDemoState(JSON.stringify(malformed))).toThrow("Invalid clinic records")
  })
  it("denies other-role pages while leaving the active account unchanged",()=>{
    expect(pageAllowedFor(hse,"/klinik")).toBe(false)
    expect(pageAllowedFor(USERS[3],"/hse")).toBe(false)
    expect(pageAllowedFor(USERS[1],"/kesehatan-awal")).toBe(false)
    expect(pageAllowedFor(clinic,"/klinik")).toBe(true)
  })
})

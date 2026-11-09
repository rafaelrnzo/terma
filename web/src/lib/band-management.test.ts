import { describe, expect, it, vi } from "vitest"
import { emptyWorkspaceState, reducer, rencanaAktif, readDemoState } from "./store"
import { currentBandAllocations } from "./band-management"
import { currentShift } from "./management-state"
import type { Action, AppState } from "./store-state"
const date="2026-11-06"
const run=(s:AppState,...a:Action[])=>a.reduce(reducer,s)
function prepared(){let s=emptyWorkspaceState(date);for(const [code,crew] of [["W01","COR"],["W02","BEK"]])s=reducer(s,{type:"SIMPAN_PEKERJA",input:{kode:code,nama:code,reguKode:crew,tanggalMulai:date,tugasKode:"PEMERIKSAAN",zonaKode:"GUDANG",apd:"Standar"}});s=run(s,{type:"BUAT_SHIFT",tanggal:date,nama:"Shift QA",workerCodes:["W01","W02"]},{type:"LOGIN",userId:"klinik-dewi"},{type:"PERSETUJUAN_MEDIS",pekerjaKode:"W01",jenis:"BAND",aktif:true},{type:"LOGIN",userId:"hse-ratna"});return s}
describe("source Band rotation and physical handoff",()=>{
 it("lets Admin start draft-day monitoring without publishing work plans",()=>{
   vi.useFakeTimers();vi.setSystemTime(new Date(`${date}T09:00:00+07:00`))
   try {
     let s=run(prepared(),{type:"LOGIN",userId:"admin-demo"},{type:"ATUR_BAND",bandId:"BAND-01",pekerjaKode:"W01"})
     const id=currentBandAllocations(s)[0].id
     const plans=JSON.stringify(s.rencana)
     expect(run(s,{type:"LOGIN",userId:"mandor-budi"},{type:"SERAH_BAND",allocationId:id}).notice?.tipe).toBe("error")
     s=reducer(s,{type:"SERAH_BAND",allocationId:id})
     expect(s.notice?.tipe).toBe("ok")
     expect(currentShift(s)?.status).toBe("DRAFT")
     expect(JSON.stringify(s.rencana)).toBe(plans)
     expect(currentBandAllocations(readDemoState(JSON.stringify(s)))[0].dipakaiPada).toBeTruthy()
     s=reducer(s,{type:"TERIMA_IOT",events:[{type:"band",deviceId:"BAND-01",heartRate:80,skinC:34,spo2:null,battery:null,receivedAt:new Date().toISOString(),seq:1}]})
     expect(currentShift(s)?.personalTelemetry).toEqual([expect.objectContaining({type:"BAND_READING",pekerjaKode:"W01",origin:"AKTUAL"})])
     vi.setSystemTime(new Date("2026-11-07T09:00:00+07:00"))
     expect(reducer(s,{type:"KEMBALI_BAND",allocationId:id}).notice?.tipe).toBe("ok")
   } finally {vi.useRealTimers()}
 })
 it("keeps future-draft, consent and closed-shift guards for Admin monitoring",()=>{
   vi.useFakeTimers();vi.setSystemTime(new Date(`${date}T09:00:00+07:00`))
   try {
     const s=run(prepared(),{type:"LOGIN",userId:"admin-demo"},{type:"ATUR_BAND",bandId:"BAND-01",pekerjaKode:"W01"})
     const id=currentBandAllocations(s)[0].id
     currentShift(s)!.tanggal="2026-11-07"
     expect(reducer(s,{type:"SERAH_BAND",allocationId:id}).notice?.tipe).toBe("error")
     currentShift(s)!.tanggal=date
     s.management!.clinic!.consents[0].aktif=false
     expect(reducer(s,{type:"SERAH_BAND",allocationId:id}).notice?.tipe).toBe("error")
     currentShift(s)!.status="CLOSED"
     expect(reducer(s,{type:"SERAH_BAND",allocationId:id}).notice?.tipe).toBe("error")
   } finally {vi.useRealTimers()}
 })
 it("requires consent and keeps each worker on one active Band",()=>{let s=prepared();expect(reducer(s,{type:"ATUR_BAND",bandId:"BAND-01",pekerjaKode:"W02"}).notice?.tipe).toBe("error");s=reducer(s,{type:"ATUR_BAND",bandId:"BAND-01",pekerjaKode:"W01"});expect(currentBandAllocations(s)).toHaveLength(1);expect(reducer(s,{type:"ATUR_BAND",bandId:"BAND-02",pekerjaKode:"W01"}).notice?.tipe).toBe("error");expect(currentBandAllocations(readDemoState(JSON.stringify(s)))).toHaveLength(1)})
 it("guards crew boundaries, reuse before return, and closure with a worn Band",()=>{let s=run(prepared(),{type:"ATUR_BAND",bandId:"BAND-01",pekerjaKode:"W01"});for(const p of rencanaAktif(s))s=reducer(s,{type:"SETUJUI",rencanaId:p.id});s=run(s,{type:"TERBITKAN_SHIFT",shiftId:date},{type:"LOGIN",userId:"mandor-sari"});const id=currentBandAllocations(s)[0].id;expect(reducer(s,{type:"SERAH_BAND",allocationId:id}).notice?.tipe).toBe("error");s=run(s,{type:"LOGIN",userId:"mandor-budi"},{type:"SERAH_BAND",allocationId:id});expect(currentBandAllocations(s)[0].dipakaiPada).toBeTruthy();s=reducer(s,{type:"LOGIN",userId:"hse-ratna"});expect(reducer(s,{type:"ATUR_BAND",bandId:"BAND-01",pekerjaKode:"W02"}).notice?.tipe).toBe("error");expect(reducer(s,{type:"TUTUP_SHIFT",shiftId:date}).notice?.pesan).toContain("pengembalian");s=run(s,{type:"LOGIN",userId:"mandor-budi"},{type:"KEMBALI_BAND",allocationId:id});expect(currentBandAllocations(s)).toHaveLength(0);expect(currentShift(s)?.bands?.[0].dikembalikanPada).toBeTruthy()})
})

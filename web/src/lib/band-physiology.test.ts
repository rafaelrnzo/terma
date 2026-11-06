import { describe, expect, it } from "vitest"
import { bandPhysiology, coreTemperatureSeries, type BandReading } from "./band-physiology"

const reading = (minute: number, change: Partial<BandReading> = {}): BandReading => ({ id: String(minute), type: "BAND_READING", pekerjaKode: "W01", deviceId: "BAND-01", origin: "REPLAY", observedAt: new Date(Date.parse("2026-11-07T08:00:00+07:00") + minute * 60000).toISOString(), heartRate: 110, skinTemperature: 35, quality: "VALID", ...change })

describe("Buller 2013 pilot core temperature", () => {
  it("reproduces the author's published numerical reference, Table 3.6", () => {
    const points = coreTemperatureSeries([124,111,119,145],37.94)
    const expected = [37.94031,37.93962,37.93979,37.94525]
    points.forEach((point,index) => expect(point.temperature).toBeCloseTo(expected[index],5))
    expect(points[3].variance).toBeCloseTo(0.00191,5)
  })
  it("requires a consecutive 30-minute series and never uses skin temperature as core", () => {
    const readings=Array.from({length:30},(_,index)=>reading(index))
    expect(bandPhysiology(readings.slice(0,29))?.estimate).toBeNull()
    const model=bandPhysiology(readings)!
    expect(model.estimate).not.toBeNull()
    expect(model.estimate).toEqual(bandPhysiology(readings.map(row=>({...row,skinTemperature:41})))?.estimate)
    expect(model.estimate?.temperature).not.toBe(35)
  })
  it("resets at missing minutes, poor PPG, a change of device or provenance", () => {
    const readings=Array.from({length:30},(_,index)=>reading(index))
    expect(bandPhysiology([...readings,reading(31)])?.estimate).toBeNull()
    expect(bandPhysiology([...readings,reading(30,{quality:"LOW_SIGNAL"})])).toBeNull()
    expect(bandPhysiology([...readings,reading(30,{deviceId:"BAND-02"})])?.minutes).toBe(1)
    expect(bandPhysiology([...readings,reading(30,{origin:"AKTUAL"})])?.minutes).toBe(1)
  })
  it("does not bridge a sudden PPG artifact into the estimate", () => {
    const readings=Array.from({length:30},(_,index)=>reading(index))
    const artifact=reading(29.05,{heartRate:160})
    expect(bandPhysiology([...readings,artifact])).toBeNull()
  })
  it("rejects invalid physiological inputs", () => {
    for (const hr of [NaN,Infinity,39,221]) expect(coreTemperatureSeries([hr])).toEqual([])
    expect(coreTemperatureSeries([100],NaN)).toEqual([])
  })
})

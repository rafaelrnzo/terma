"use client"

import { currentBandAllocations } from "./band-management"
import { hasConsent } from "./clinic"
import { currentShift, managementOf } from "./management-state"
import { subscribeIot } from "./iot-client"
import { bodyMonitoring } from "./body-monitoring"
import { readDemoState } from "./workspace-document"
import type { Action, AppState } from "./store-state"
import type { IotEvent } from "./iot"
import type { User } from "./types"

async function workspaceRequest(signal: AbortSignal, action?: Action): Promise<AppState> {
  signal.throwIfAborted()
  const response = await fetch(action ? "/api/workspace/actions" : "/api/workspace", {
    method: action ? "POST" : "GET", signal, cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: action ? JSON.stringify({ action }) : undefined,
  })
  const body: unknown = await response.json()
  if (!response.ok || !body || typeof body !== "object" || !("state" in body)) throw new Error("Ruang kerja belum dapat diperbarui.")
  if ("notice" in body && body.notice && typeof body.notice === "object" && "tipe" in body.notice && body.notice.tipe === "error") {
    throw new Error("pesan" in body.notice && typeof body.notice.pesan === "string" ? body.notice.pesan : "Penyiapan IoT belum berhasil.")
  }
  return readDemoState(JSON.stringify(body.state))
}

function nextCard(signal: AbortSignal): Promise<Extract<IotEvent, { type: "water" }>> {
  const after = Date.now()
  return new Promise((resolve, reject) => {
    const stop = subscribeIot(0, event => {
      if (event.type !== "water" || Date.parse(event.receivedAt) < after) return
      cleanup(); resolve(event)
    })
    const abort = () => { cleanup(); reject(new DOMException("Dihentikan", "AbortError")) }
    const timer = setTimeout(() => { cleanup(); reject(new Error("Tap kartu Raya di Water Station, lalu jalankan presentasi lagi.")) }, 120000)
    const cleanup = () => { stop(); clearTimeout(timer); signal.removeEventListener("abort", abort) }
    signal.addEventListener("abort", abort, { once: true })
    if (signal.aborted) abort()
  })
}

export async function prepareRayaIot(user: User, signal: AbortSignal, prompt: (text: string) => void, waitUntilRunning: () => Promise<void>) {
  const apply = async (action: Action) => { await waitUntilRunning(); return workspaceRequest(signal, action) }
  let state = await workspaceRequest(signal)
  const code = "RAYA001"
  prompt("Konfirmasikan persetujuan Band pada baris Raya jika belum tercatat.")
  while (!hasConsent(state, code, "BAND")) {
    await new Promise(resolve => setTimeout(resolve, 1000)); state = await workspaceRequest(signal)
  }
  let allocation = currentBandAllocations(state).find(row => row.bandId === "BAND-01" && row.pekerjaKode === code)
  if (!allocation) {
    state = await apply({ type: "ATUR_BAND", bandId: "BAND-01", pekerjaKode: code })
    allocation = currentBandAllocations(state).find(row => row.bandId === "BAND-01" && row.pekerjaKode === code)
  }
  if (!allocation) throw new Error("BAND-01 belum dapat ditetapkan ke Raya.")
  if (!allocation.dipakaiPada) state = await apply({ type: "SERAH_BAND", allocationId: allocation.id })

  const zone = currentShift(state)?.workspace.penugasan.find(row => row.pekerjaKode === code)?.zonaKode
  const placement = managementOf(state).stationPlacements?.find(row => row.deviceId === "TST-01")
  if (placement && zone && placement.zonaKode !== zone) {
    state = await apply({ type: "SIMPAN_PENEMPATAN_STATION", deviceId: placement.deviceId, namaLokasi: placement.namaLokasi, lat: placement.lat, lng: placement.lng, selisihGlobe: placement.selisihGlobe, zonaKode: zone })
  }

  if (!managementOf(state).workers.find(row => row.kode === code)?.kartuUid || !currentShift(state)?.personalTelemetry?.some(event => event.type === "WATER_VISIT" && event.pekerjaKode === code && event.origin === "AKTUAL")) {
    prompt("Tap kartu Raya di Water Station. Kartu akan ditautkan dan kunjungan pertama dicatat.")
    const tap = await nextCard(signal)
    state = await workspaceRequest(signal)
    const management = managementOf(state)
    const worker = management.workers.find(row => row.kode === code)
    const assignment = management.assignments.find(row => row.pekerjaKode === code)
    if (!worker || !assignment) throw new Error("Data Raya belum lengkap.")
    if (management.workers.some(row => row.kode !== code && row.kartuUid === tap.uid)) throw new Error("Kartu ini sudah milik pekerja lain. Gunakan kartu Raya.")
    if (worker.kartuUid && worker.kartuUid !== tap.uid) throw new Error("Kartu Raya baru saja diubah. Jalankan presentasi lagi.")
    if (!worker.kartuUid) state = await apply({ type: "SIMPAN_PEKERJA", previousCode: worker.kode, expectedRevision: worker.revision ?? 1, input: {
      kode: worker.kode, nama: worker.nama, reguKode: worker.reguKode, tanggalMulai: worker.tanggalMulai,
      tugasKode: assignment.tugasKode, zonaKode: assignment.zonaKode, apd: assignment.apd, kartuUid: tap.uid,
    } })
    state = await apply({ type: "TERIMA_IOT", events: [tap] })
  }

  prompt("Tempelkan sensor Band ke kulit dengan stabil. Menunggu bacaan baru Raya dan pembaruan Station.")
  const deadline = Date.now() + 120000
  while (Date.now() < deadline) {
    const shift = currentShift(state)
    const model = shift ? bodyMonitoring(state, user, code, shift.tanggal) : null
    const heat = model?.signals.find(row => row.key === "heat")
    const band = model?.signals.find(row => row.key === "band")
    const water = model?.signals.find(row => row.key === "hydration")
    if (heat?.source.startsWith("AKTUAL") && heat.tone !== "unknown" && band && band.tone !== "unknown" && water && water.tone !== "unknown") return
    await new Promise(resolve => setTimeout(resolve, 1000)); state = await workspaceRequest(signal)
  }
  throw new Error("Bacaan baru belum lengkap. Periksa daya Station dan pemasangan sensor Band, lalu ulangi presentasi.")
}

import { randomBytes, scryptSync } from "node:crypto"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { USERS } from "../config"
import { managementOf } from "../management-state"
import { emptyWorkspaceState, reducer } from "../store"
import type { Action, AppState } from "../store-state"
import { authenticate, hashPassword, sessionToken, userFromToken, verifyPassword } from "./auth"
import { projectFor } from "./projection"
import { applyAction, workspace } from "./workspace-store"
import { prepareMorningDraft } from "./morning-draft"

const user = (role: string) => USERS.find(row => row.role === role)!
const hse = user("HSE"), foreman = user("MANDOR"), clinic = user("KLINIK")

beforeEach(() => {
  process.env.TERMA_DATA_DIR = mkdtempSync(join(tmpdir(), "terma-"))
})

describe("server authentication", () => {
  it("verifies hashes written by the set-password script format", () => {
    const salt = randomBytes(16).toString("hex")
    const scriptHash = `scrypt$${salt}$${scryptSync("rahasia-lapangan", salt, 64).toString("hex")}`
    expect(verifyPassword("rahasia-lapangan", scriptHash)).toBe(true)
    expect(verifyPassword("salah", hashPassword("rahasia-lapangan"))).toBe(false)
    writeFileSync(join(process.env.TERMA_DATA_DIR!, "users.json"), JSON.stringify({ ratna: scriptHash }))
    expect(authenticate("Ratna", "rahasia-lapangan")?.id).toBe(hse.id)
    expect(authenticate("budi", "rahasia-lapangan")).toBeNull() // no password set for budi
  })

  it("accepts only untampered, unexpired session tokens", () => {
    const token = sessionToken(hse, Date.now())
    expect(userFromToken(token)?.id).toBe(hse.id)
    expect(userFromToken(token.replace(/.$/, c => c === "A" ? "B" : "A"))).toBeNull()
    expect(userFromToken(sessionToken(hse, Date.now() - 13 * 3600_000))).toBeNull()
  })
})

describe("shared workspace", () => {
  const worker: Action = { type: "SIMPAN_PEKERJA", input: { kode: "W01", nama: "Andi", reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } }

  it("runs actions as the signed-in user and persists only permitted changes", () => {
    expect(applyAction(foreman, worker).notice?.tipe).toBe("error") // foremen cannot manage workers
    expect(managementOf(workspace().state).workers.map(row => row.kode)).not.toContain("W01")
    const before = workspace().version
    applyAction(hse, worker)
    const start = workspace().version
    expect(start).not.toBe(before)
    const saved = JSON.parse(readFileSync(join(process.env.TERMA_DATA_DIR!, "workspace.json"), "utf8")) as AppState
    expect(managementOf(saved).workers.map(row => row.kode)).toContain("W01")
    expect(applyAction(hse, { type: "LOGIN", userId: clinic.id }).version).toBe(start) // accounts never switch from the client
  })

  it("keeps clinical notes, complaints and Band values on the server for non-clinic roles", () => {
    const date = "2026-11-06"
    const run = (state: AppState, ...actions: Action[]) => actions.reduce(reducer, state)
    let s = run(emptyWorkspaceState(date), worker, { type: "BUAT_SHIFT", tanggal: date, nama: "Shift", workerCodes: ["W01"] },
      { type: "LOGIN", userId: clinic.id }, { type: "PERSETUJUAN_MEDIS", pekerjaKode: "W01", jenis: "MCU", aktif: true },
      { type: "SIMPAN_PROFIL_MEDIS", input: { pekerjaKode: "W01", hipertensi: true, diabetes: false, jantung: false, riwayatPanas: false, obatBerisiko: false, catatan: "rahasia" } },
      { type: "LOGIN", userId: hse.id }, { type: "CATAT_CHECKIN", pekerjaKode: "W01", kondisi: "KURANG_BUGAR", keluhan: ["Demam"], persetujuan: true })
    const m = managementOf(s)
    s = { ...s, management: { ...m, shifts: m.shifts.map(shift => ({ ...shift, personalTelemetry: [{ id: "b1", type: "BAND_READING" as const, pekerjaKode: "W01", deviceId: "BAND-01", observedAt: `${date}T08:00:00Z`, origin: "AKTUAL" as const, heartRate: 150, skinTemperature: 35, quality: "VALID" as const }] })) } }
    expect(managementOf(s).clinic?.profiles).toHaveLength(1)
    expect(managementOf(s).shifts[0].readiness?.checkins[0].keluhan).toEqual(["Demam"])
    const forHse = JSON.parse(JSON.stringify(projectFor(s, hse))) as AppState
    const shift = managementOf(forHse).shifts[0]
    expect(managementOf(forHse).clinic?.profiles).toEqual([])
    expect(shift.readiness?.checkins[0].keluhan).toEqual([])
    expect(shift.personalTelemetry?.[0]).toMatchObject({ heartRate: null, skinTemperature: null })
    expect(forHse.sesi?.userId).toBe(hse.id)
    expect(managementOf(projectFor(s, clinic)).clinic?.profiles).toHaveLength(1)
  })
})

describe("05.30 draft", () => {
  it("creates today's draft from the last shift's participants as the system account, even without a forecast", async () => {
    const hseUser = USERS.find(row => row.role === "HSE")!
    applyAction(hseUser, { type: "SIMPAN_PEKERJA", input: { kode: "W01", nama: "Andi", reguKode: "COR", tanggalMulai: "2026-01-01", tugasKode: "PEMERIKSAAN", zonaKode: "GUDANG", apd: "Standar" } })
    applyAction(hseUser, { type: "BUAT_SHIFT", tanggal: "2026-11-05", nama: "Shift kemarin", workerCodes: ["W01"] })
    const done = await prepareMorningDraft("2026-11-06", () => Promise.reject(new Error("offline")))
    const shift = managementOf(workspace().state).shifts.find(row => row.tanggal === "2026-11-06")
    expect(shift).toMatchObject({ nama: "Shift pagi", status: "DRAFT" })
    expect(shift?.workspace.pekerja.map(row => row.kode)).toEqual(["W01"])
    expect(done.join(" ")).toContain("draf shift 2026-11-06")
    expect((await prepareMorningDraft("2026-11-06", () => Promise.reject(new Error("offline")))).join(" ")).not.toContain("draf shift") // once per day
    expect(authenticate("sistem", "apa-saja")).toBeNull()
  })
})


import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { BMKG_URL, parseBmkgForecast } from "../bmkg"
import { SYSTEM_USER_ID, USERS } from "../config"
import { managementOf } from "../management-state"
import { dataDir } from "./data-dir"
import { applyAction, workspace } from "./workspace-store"

/** 05.30 WIB: pull the forecast and prepare today's draft shift (plans computed, awaiting HSE approval). */
const RUN_AT = { hour: 5, minute: 30 }
const marker = () => join(dataDir(), "morning-draft")

function jakartaNow(now = Date.now()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(now)).map(part => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

/** The draft step itself; returns what it did. Exported for tests. */
export async function prepareMorningDraft(date: string, fetchForecast: () => Promise<unknown> = () => fetch(BMKG_URL, { signal: AbortSignal.timeout(12000) }).then(response => response.json())) {
  const system = USERS.find(user => user.id === SYSTEM_USER_ID)
  if (!system) throw new Error("Akun sistem TERMA tidak terdaftar di config")
  const done: string[] = []
  try {
    applyAction(system, { type: "CUACA_DITERIMA", data: parseBmkgForecast(await fetchForecast()) })
    done.push("prakiraan BMKG diperbarui")
  } catch { done.push("prakiraan BMKG belum tersedia; rencana memakai data yang ada") }
  const shifts = managementOf(workspace().state).shifts
  if (!shifts.some(shift => shift.tanggal === date)) {
    const previous = shifts.filter(shift => shift.tanggal < date).toSorted((a, b) => b.tanggal.localeCompare(a.tanggal))[0]
    const workerCodes = previous?.workspace.pekerja.map(worker => worker.kode) ?? []
    if (workerCodes.length) {
      applyAction(system, { type: "BUAT_SHIFT", tanggal: date, nama: "Shift pagi", workerCodes })
      done.push(`draf shift ${date} dibuat dari peserta ${previous.nama}`)
    }
  }
  return done
}

/** Checks once a minute; runs at most once per day per data directory, after 05.30. */
export function ensureMorningJob() {
  const holder = globalThis as { __termaMorningJob?: true }
  if (holder.__termaMorningJob) return
  holder.__termaMorningJob = true
  setInterval(() => {
    const { date, minutes } = jakartaNow()
    let last = ""
    try { last = readFileSync(marker(), "utf8").trim() } catch { /* never ran */ }
    if (last === date || minutes < RUN_AT.hour * 60 + RUN_AT.minute) return
    writeFileSync(marker(), date)
    void prepareMorningDraft(date)
  }, 60_000)
}

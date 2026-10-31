"use client"

import { ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/store"
import { USERS } from "@/lib/config"
import { LABEL_PERAN } from "@/lib/access"
import type { Role } from "@/lib/types"

export function ShiftHandoff({ owners, crewCodes }: { owners: Role[]; crewCodes?: string[] }) {
  const { state, user, dispatch } = useApp()
  if (!user || owners.includes(user.role)) return null
  const candidates = USERS.filter(person => owners.includes(person.role) && (person.role !== "MANDOR" || state.pekerja.some(worker => worker.reguKode === person.reguKode) && (!crewCodes || crewCodes.includes(person.reguKode ?? ""))))
  return <section className="wizard-handoff" data-guide="handoff"><p className="eyebrow">SERAH TERIMA TUGAS</p><h3>Langkah ini dikerjakan oleh {owners.map(owner => LABEL_PERAN[owner]).join(" atau ")}.</h3><p>Pengguna aktif: {user.nama} · {LABEL_PERAN[user.role]}. Buka penanggung jawab berikutnya untuk melanjutkan pada shift yang sama.</p><div className="mt-4 flex flex-wrap gap-2">{candidates.map(person => <Button key={person.id} variant="outline" onClick={() => dispatch({ type: "LOGIN", userId: person.id })}>Buka tugas {person.nama}{person.reguKode ? ` · ${person.reguKode}` : ""}<ArrowRightIcon /></Button>)}</div></section>
}

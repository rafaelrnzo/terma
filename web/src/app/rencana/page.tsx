"use client"
import { PageHeader } from "@/components/app-shell"
import { ShiftPlanReview } from "@/components/shift-plan-review"

export default function RencanaPage() {
  return <><PageHeader title="Rencana & persetujuan" summary="Daftar rencana pekerja berdasarkan risiko, sumber data dan versi persetujuan. Buka detail pekerja untuk memeriksa jadwal serta memberikan keputusan HSE." /><section className="summon-panel p-5"><ShiftPlanReview /></section></>
}

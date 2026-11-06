import { PageHeader } from "@/components/app-shell"
import { ShiftHealthReview } from "@/components/shift-health-review"

export default function AttendancePage() {
  return <><PageHeader title="Absensi & kondisi awal" summary="Pekerja mencatat kehadiran melalui layar absen. HSE meninjau kondisi awal sebelum menyetujui rencana kerja." /><div className="summon-panel p-6"><ShiftHealthReview /></div></>
}

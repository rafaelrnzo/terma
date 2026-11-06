import { PageHeader } from "@/components/app-shell"
import { ShiftHealthReview } from "@/components/shift-health-review"

export default function AttendancePage() {
  return <><PageHeader title="Absensi pekerja" summary="Pekerja mencatat kehadiran melalui layar absen. Check-in berlangsung setelah instruksi pagi. Jawaban kondisi tubuh hanya tersedia untuk Klinik." /><div className="summon-panel p-6"><ShiftHealthReview /></div></>
}

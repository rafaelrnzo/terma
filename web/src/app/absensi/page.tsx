import { PageHeader } from "@/components/app-shell"
import { ShiftHealthReview } from "@/components/shift-health-review"

export default function AttendancePage() {
  return <><PageHeader title="Absensi pekerja" summary="Kehadiran peserta shift." /><div className="summon-panel p-6"><ShiftHealthReview /></div></>
}

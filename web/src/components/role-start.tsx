"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRightIcon, ShieldCheckIcon, UsersThreeIcon, ThermometerIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ShiftForm } from "@/components/shift-form"
import { LABEL_PERAN } from "@/lib/access"
import { shiftTaskFlow } from "@/lib/shift-task-flow"
import { managementOf } from "@/lib/management-state"
import { useApp } from "@/lib/store"
import type { ShiftRecord } from "@/lib/management-types"

function StartPanel({ title, children, icon, actions }: { title: string; children: ReactNode; icon: ReactNode; actions: ReactNode }) {
  return <section className="role-start summon-panel" data-guide="workflow-start"><div className="role-start-copy"><span className="role-start-icon">{icon}</span><div><p className="eyebrow">TUGAS UTAMA ANDA</p><h2>{title}</h2><p>{children}</p></div></div><div className="role-start-actions">{actions}</div></section>
}

export function RoleStart({ ongoing, workerCount }: { ongoing?: ShiftRecord; workerCount: number }) {
  const { state, user, dispatch } = useApp()
  if (!user) return null
  const flow = ongoing ? shiftTaskFlow({ ...state, ...ongoing.workspace, tanggal: ongoing.tanggal, management: { ...managementOf(state), activeId: ongoing.id } }, user) : null
  const task = flow?.steps[flow.current]
  const shiftLink = ongoing && <Button asChild><Link href={`/shift/${ongoing.id}`} onClick={() => dispatch({ type: "BUKA_SHIFT", shiftId: ongoing.id })}>{user.role === "MANDOR" ? "Buka tugas regu" : "Buka alur shift"}<ArrowRightIcon /></Link></Button>
  switch (user.role) {
    case "PETUGAS_DATA":
      return <StartPanel title={!workerCount ? "Mulai dengan data pekerja" : "Lengkapi data sebelum ditinjau HSE"} icon={<ThermometerIcon size={26} />} actions={<><Button asChild><Link href="/impor">Kelola data pekerja<ArrowRightIcon /></Link></Button>{shiftLink}</>}>
        {!workerCount ? "Tambahkan identitas, regu, tugas, dan zona awal pekerja. HSE menggunakan data ini untuk membuat shift." : ongoing ? "Periksa data pekerja, lalu lengkapi bacaan pada tugas Sensor dan data Forecasting. HSE bertanggung jawab atas persetujuan rencana." : "Data pekerja siap. HSE perlu membuat draft shift sebelum Anda melengkapi bacaan WBGT dan prakiraan untuk shift tersebut."}
      </StartPanel>
    case "MANDOR": {
      const waiting = !task || !task.owners.includes("MANDOR")
      return <StartPanel title={!ongoing ? "Menunggu shift dari HSE" : waiting ? "Menunggu tindak lanjut HSE" : `Giliran Anda: ${task.title}`} icon={<UsersThreeIcon size={26} />} actions={shiftLink || <Button asChild variant="outline"><Link href="/panduan">Lihat tugas mandor<ArrowRightIcon /></Link></Button>}>
        {!ongoing ? "HSE menyiapkan rencana untuk regu Anda. Setelah peserta ditetapkan, shift akan muncul di daftar di bawah." : waiting ? `Tahap saat ini: ${task?.title}. Penanggung jawab: ${task?.owners.map(role => LABEL_PERAN[role]).join(" / ")}. ${task?.key === "finish" ? "Laporan regu sudah diserahkan. HSE memverifikasi dan menutup shift." : "Anda mulai setelah HSE membagikan instruksi."}` : "Baca dan akui instruksi, jalankan pekerjaan sesuai rencana, lalu laporkan durasi aktual. Laporan Anda selanjutnya diperiksa HSE."}
      </StartPanel>
    }
    case "HSE":
      return <StartPanel title={!workerCount ? "Mulai dengan menambahkan pekerja" : !ongoing ? "Buat shift dan pilih peserta" : task?.owners.includes("HSE") ? `Lanjutkan: ${task.title}` : "Menunggu laporan mandor"} icon={<ShieldCheckIcon size={26} />} actions={!workerCount ? <Button asChild><Link href="/impor">Tambah data pekerja<ArrowRightIcon /></Link></Button> : shiftLink || <ShiftForm />}>
        {!workerCount ? "Tambahkan pekerja atau minta petugas data menyiapkan master. Setelah itu, buat draft shift dan pilih pesertanya." : !ongoing ? "Pilih tanggal shift. Tinjau adaptasi dan bacaan WBGT, setujui rencana, lalu bagikan instruksi ke mandor." : `${ongoing.nama}. ${task?.description} Shift selesai setelah Anda memverifikasi laporan dan menutupnya.`}
      </StartPanel>
  }
}

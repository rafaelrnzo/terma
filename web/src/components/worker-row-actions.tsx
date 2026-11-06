"use client"

import { useRef, useState } from "react"
import { DropdownMenu } from "radix-ui"
import { ArchiveIcon } from "@phosphor-icons/react/dist/csr/Archive"
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise"
import { DotsThreeIcon } from "@phosphor-icons/react/dist/csr/DotsThree"
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple"
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash"
import { Button } from "@/components/ui/button"
import { WorkerForm } from "@/components/worker-form"
import { ConfirmAction } from "@/components/confirm-action"
import { useApp, useIzin } from "@/lib/store"
import { workerUsage } from "@/lib/worker-management"
import type { Pekerja } from "@/lib/types"

export function WorkerRowActions({ worker, archived }: { worker: Pekerja; archived: boolean }) {
  const { state, dispatch } = useApp()
  const izin = useIzin()
  const [edit, setEdit] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const usage = workerUsage(state, worker.kode)
  const allowed = izin("KELOLA_PEKERJA")
  const label = usage ? "Arsipkan" : "Hapus"
  const restoreFocus = () => requestAnimationFrame(() => trigger.current?.focus())
  return <>
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild><Button ref={trigger} variant="ghost" size="icon-sm" aria-label={`Aksi lainnya untuk ${worker.nama}`}><DotsThreeIcon size={20} /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="row-action-menu" align="end" sideOffset={6} onCloseAutoFocus={event => { if (edit || confirm) event.preventDefault() }}>
        <DropdownMenu.Item disabled={!allowed} onSelect={() => setEdit(true)}><PencilSimpleIcon size={16} />Edit pekerja</DropdownMenu.Item>
        {archived ? <DropdownMenu.Item disabled={!allowed} onSelect={() => dispatch({ type: "ARSIP_PEKERJA", kode: worker.kode, archived: false, expectedRevision: worker.revision ?? 1 })}><ArrowCounterClockwiseIcon size={16} />Aktifkan kembali</DropdownMenu.Item> : <DropdownMenu.Item disabled={!allowed} className={!usage ? "text-destructive" : undefined} onSelect={() => setConfirm(true)}>{usage ? <ArchiveIcon size={16} /> : <TrashIcon size={16} />}{label}</DropdownMenu.Item>}
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    {edit && <WorkerForm worker={worker} openOnMount onClose={() => { setEdit(false); restoreFocus() }} />}
    {confirm && <ConfirmAction openOnMount onClose={() => { setConfirm(false); restoreFocus() }} label={label} title={`${label} ${worker.nama}?`} description={usage ? "Pekerja diarsipkan dari shift baru. Riwayat shift tetap tersimpan." : "Hapus pekerja yang belum dipakai oleh shift beserta penugasan awalnya."} onConfirm={() => dispatch(usage ? { type: "ARSIP_PEKERJA", kode: worker.kode, archived: true, expectedRevision: worker.revision ?? 1 } : { type: "HAPUS_PEKERJA", kode: worker.kode, expectedRevision: worker.revision ?? 1 })} />}
  </>
}

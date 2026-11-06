"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ConfirmAction({ label, title, description, onConfirm, disabled, guide, openOnMount = false, onClose }: { label: string; title: string; description: string; onConfirm: () => void; disabled?: boolean; guide?: string; openOnMount?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(openOnMount)
  const changeOpen = (value: boolean) => { setOpen(value); if (!value) onClose?.() }
  return <Dialog open={open} onOpenChange={changeOpen}>{!openOnMount && <DialogTrigger asChild><Button variant="outline" disabled={disabled} data-guide={guide}>{label}</Button></DialogTrigger>}<DialogContent onCloseAutoFocus={event => { if (openOnMount) event.preventDefault() }}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => changeOpen(false)}>Batal</Button><Button onClick={() => { onConfirm(); changeOpen(false) }}>{label}</Button></div></DialogContent></Dialog>
}

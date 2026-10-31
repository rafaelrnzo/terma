"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ConfirmAction({ label, title, description, onConfirm, disabled, guide }: { label: string; title: string; description: string; onConfirm: () => void; disabled?: boolean; guide?: string }) {
  const [open, setOpen] = useState(false)
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" disabled={disabled} data-guide={guide}>{label}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={() => { onConfirm(); setOpen(false) }}>{label}</Button></div></DialogContent></Dialog>
}

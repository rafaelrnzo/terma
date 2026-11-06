"use client"

import { useId, useRef, useState, type KeyboardEvent } from "react"
import { Popover } from "radix-ui"
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown"
import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, selectTriggerClassName } from "./select"
import { cn } from "@/lib/utils"

interface SelectOption<Value extends string> { value: Value; label: string; disabled?: boolean; keywords?: string }
interface OptionSelectProps<Value extends string> {
  id?: string
  value: string
  options: readonly SelectOption<Value>[]
  onValueChange: (value: Value) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  "aria-label"?: string
}

/** Short lists reuse Select; longer lists add search while retaining canonical option IDs. */
export function OptionSelect<Value extends string>({ id, value, options, onValueChange, disabled, placeholder = "Pilih pilihan", searchPlaceholder = "Cari pilihan…", className, "aria-label": label }: OptionSelectProps<Value>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlighted, setHighlighted] = useState<Value | null>(null)
  const search = useRef<HTMLInputElement>(null)
  const listId = useId()
  const selected = options.find(option => option.value === value)
  const selectedIndex = options.findIndex(option => option.value === value)
  const filtered = options.map((option, index) => ({ ...option, index })).filter(option => `${option.label} ${option.value} ${option.keywords ?? ""}`.toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")))
  const enabled = filtered.filter(option => !option.disabled)
  const active = enabled.find(option => option.value === highlighted) ?? enabled[0]

  function changeOpen(next: boolean) {
    setOpen(next)
    if (next) { setQuery(""); setHighlighted(selected && !selected.disabled ? selected.value : null) }
  }
  function choose(option: SelectOption<Value>) { onValueChange(option.value); setOpen(false) }
  function navigate(event: KeyboardEvent<HTMLInputElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault()
      if (!enabled.length) return
      const current = enabled.findIndex(option => option.value === active?.value)
      const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length
      setHighlighted(enabled[next].value)
      document.getElementById(`${listId}-${enabled[next].index}`)?.scrollIntoView({ block: "nearest" })
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (active) choose(active)
    }
  }

  if (options.length <= 6) return <Select value={selectedIndex < 0 ? "" : String(selectedIndex)} onValueChange={index => { const option = options[Number(index)]; if (option && !option.disabled) onValueChange(option.value) }} disabled={disabled}>
    <SelectTrigger id={id} aria-label={label} className={cn("w-full bg-card", className)}><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent position="popper">{options.map((option, index) => <SelectItem key={option.value} value={String(index)} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectContent>
  </Select>

  return <Popover.Root open={open} onOpenChange={changeOpen}>
    <Popover.Trigger asChild><button id={id} data-slot="select-trigger" data-size="default" type="button" role="combobox" aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-label={label} disabled={disabled} className={cn(selectTriggerClassName, "w-full bg-card", className)}><span className={cn("min-w-0 flex-1 text-left", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span><CaretDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden /></button></Popover.Trigger>
    <Popover.Portal><Popover.Content align="start" sideOffset={4} collisionPadding={16} onOpenAutoFocus={event => { event.preventDefault(); search.current?.focus() }} className="z-50 w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
      <div className="relative border-b p-2"><MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input ref={search} type="search" value={query} onChange={event => { setQuery(event.target.value); setHighlighted(null) }} onKeyDown={navigate} placeholder={searchPlaceholder} aria-label={searchPlaceholder} aria-controls={listId} aria-activedescendant={active ? `${listId}-${active.index}` : undefined} className="pl-9" autoComplete="off" /></div>
      <div id={listId} role="listbox" aria-label={label ?? placeholder} className="max-h-64 overflow-y-auto p-1">
        {filtered.map(option => <button key={option.value} id={`${listId}-${option.index}`} type="button" role="option" tabIndex={-1} aria-selected={option.value === value} disabled={option.disabled} onMouseDown={event => event.preventDefault()} onPointerMove={() => { if (!option.disabled) setHighlighted(option.value) }} onClick={() => choose(option)} className={cn("flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm", active?.value === option.value && "bg-accent text-accent-foreground", option.value === value && "font-medium text-primary")}><span className="min-w-0 flex-1 break-words">{option.label}</span>{option.value === value && <CheckIcon weight="bold" className="size-4 shrink-0" aria-hidden />}</button>)}
        {!filtered.length && <p role="status" className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada pilihan yang cocok.</p>}
      </div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}

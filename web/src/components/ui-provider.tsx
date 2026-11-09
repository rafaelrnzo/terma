"use client"

import { ThemeProvider, useTheme } from "next-themes"
import { MotionConfig } from "motion/react"
import { MoonIcon as Moon } from "@phosphor-icons/react/dist/csr/Moon"
import { SunIcon as Sun } from "@phosphor-icons/react/dist/csr/Sun"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function UiProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem><MotionConfig reducedMotion="user">{children}</MotionConfig></ThemeProvider>
}

export function ThemeToggle({ sidebar = false }: { sidebar?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  return <Button variant={sidebar ? "ghost" : "outline"} size={sidebar ? "default" : "icon"} className={sidebar ? "sidebar-theme-button" : undefined} aria-label="Ganti tema terang atau gelap" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
    <Sun className="hidden dark:block" aria-hidden /><Moon className="dark:hidden" aria-hidden />{sidebar && <span>Tampilan {resolvedTheme === "dark" ? "terang" : "gelap"}</span>}
  </Button>
}

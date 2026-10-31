"use client"

import { ThemeProvider, useTheme } from "next-themes"
import { MotionConfig } from "motion/react"
import { MoonIcon as Moon, SunIcon as Sun } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function UiProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem><MotionConfig reducedMotion="user">{children}</MotionConfig></ThemeProvider>
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return <Button variant="outline" size="icon" aria-label="Ganti tema terang atau gelap" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
    <Sun className="hidden dark:block" aria-hidden /><Moon className="dark:hidden" aria-hidden />
  </Button>
}

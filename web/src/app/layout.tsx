import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { AppProvider } from "@/lib/store"

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "TERMA · Asisten pengelolaan paparan panas kerja",
  description: "Rencana kerja panas yang bisa ditindaklanjuti mandor dan ditinjau HSE.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  )
}

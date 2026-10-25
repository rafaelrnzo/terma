import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { AppProvider } from "@/lib/store"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TERMA · Asisten pengelolaan paparan panas kerja",
  description: "Rencana kerja panas yang bisa ditindaklanjuti mandor dan ditinjau HSE.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  )
}

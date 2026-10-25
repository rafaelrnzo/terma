import type { Metadata } from "next"
import { Open_Sans, Roboto_Slab } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { AppProvider } from "@/lib/store"

const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"], display: "swap" })
const robotoSlab = Roboto_Slab({ variable: "--font-roboto-slab", subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "TERMA · Asisten pengelolaan paparan panas kerja",
  description: "Rencana kerja panas yang bisa ditindaklanjuti mandor dan ditinjau HSE.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${openSans.variable} ${robotoSlab.variable}`}>
      <body className="antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  )
}

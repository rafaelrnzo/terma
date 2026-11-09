import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { AppProvider } from "@/lib/store"
import { UiProvider } from "@/components/ui-provider"
import { DemoFlow } from "@/components/demo-flow"

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "TERMA · Thermal Exposure & Renal Monitoring Assistant",
  description: "Satu rencana paparan panas untuk setiap pekerja. Pemantauan IoT, persetujuan HSE, dan tindak lanjut klinik.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={geist.variable} suppressHydrationWarning>
      <body className="antialiased">
        <UiProvider><AppProvider>
          <AppShell>{children}</AppShell><DemoFlow />
        </AppProvider></UiProvider>
      </body>
    </html>
  )
}

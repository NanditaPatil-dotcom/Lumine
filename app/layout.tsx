import type React from "react"
import type { Metadata } from "next"
import { Geist, Inter, Manrope, Lekton} from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { TimerProvider } from "@/contexts/timer-context"
import "./globals.css"
import ClientLayout from "./client-layout"


const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})


const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const lekton = Lekton({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lekton",
  weight: ["400", "700"], 
})

export const metadata: Metadata = {
  title: "Lumine - lighting up your ideas",
  description: "AI-powered note-taking app with spaced repetition and smart organization",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
     
      <body className={`${manrope.variable} ${inter.variable} ${lekton.variable} ${geist.variable}`}>
        <ThemeProvider attribute="class">
          <TimerProvider defaultMinutes={25}>
            <AuthProvider>
              <ClientLayout>{children}</ClientLayout>
            </AuthProvider>
          </TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

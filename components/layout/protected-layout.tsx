"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { NotesProvider } from "@/contexts/notes-context"
import { CalendarProvider } from "@/contexts/calendar-context"
import { SpacedRepetitionProvider } from "@/contexts/spaced-repetition-context"
import { AIProvider } from "@/contexts/ai-context"

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <NotesProvider>
      <CalendarProvider>
        <SpacedRepetitionProvider>
          <AIProvider>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <main className="flex-1 overflow-hidden">{children}</main>
              </div>
            </SidebarProvider>
          </AIProvider>
        </SpacedRepetitionProvider>
      </CalendarProvider>
    </NotesProvider>
  )
}

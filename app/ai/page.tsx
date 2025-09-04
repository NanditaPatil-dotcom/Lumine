"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { AIProvider } from "@/contexts/ai-context"
import { NotesProvider } from "@/contexts/notes-context"
import { AIAssistant } from "@/components/ai/ai-assistant"


export default function AIPage() {
  return (
    <ProtectedLayout>
      <NotesProvider>
        <AIProvider>
          <AIAssistant />
        </AIProvider>
      </NotesProvider>
    </ProtectedLayout>
  )
}
